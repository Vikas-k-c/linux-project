#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 /path/to/linux-kernel-source" >&2
  exit 1
fi

kernel_src="$(realpath "$1")"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_kernel_dir="$(cd "$script_dir/.." && pwd)"

cd "$kernel_src"

required_files=(
  "Makefile"
  "include/linux/syscalls.h"
  "arch/x86/entry/syscalls/syscall_64.tbl"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing required kernel file: $kernel_src/$file" >&2
    exit 1
  fi
done

if grep -q "barrier_init" arch/x86/entry/syscalls/syscall_64.tbl; then
  echo "barrier syscalls already appear to be added to this kernel tree."
  exit 0
fi

next64="$(
  awk '$1 ~ /^[0-9]+$/ { if ($1 > max) max=$1 } END { print max + 1 }' \
    arch/x86/entry/syscalls/syscall_64.tbl
)"

next32=""
if [ -f arch/x86/entry/syscalls/syscall_32.tbl ]; then
  next32="$(
    awk '$1 ~ /^[0-9]+$/ { if ($1 > max) max=$1 } END { print max + 1 }' \
      arch/x86/entry/syscalls/syscall_32.tbl
  )"
fi

mkdir -p barrier

cat > barrier/barrier_sys.c <<'BARRIER_SYS_C'
#include <linux/errno.h>
#include <linux/jiffies.h>
#include <linux/kernel.h>
#include <linux/list.h>
#include <linux/mutex.h>
#include <linux/printk.h>
#include <linux/refcount.h>
#include <linux/sched.h>
#include <linux/slab.h>
#include <linux/syscalls.h>
#include <linux/wait.h>

struct barrier_entry {
	struct list_head list;
	unsigned int id;
	pid_t tgid;
	unsigned int count;
	unsigned int arrived;
	unsigned int generation;
	signed int timeout_ns;
	wait_queue_head_t waitq;
	struct mutex lock;
	refcount_t refcount;
};

static LIST_HEAD(barrier_list);
static DEFINE_MUTEX(barrier_list_lock);
static atomic_t next_barrier_id = ATOMIC_INIT(0);

static void barrier_put(struct barrier_entry *barrier)
{
	if (refcount_dec_and_test(&barrier->refcount))
		kfree(barrier);
}

static struct barrier_entry *find_barrier_get_locked(unsigned int id, pid_t tgid)
{
	struct barrier_entry *barrier;

	list_for_each_entry(barrier, &barrier_list, list) {
		if (barrier->id == id && barrier->tgid == tgid) {
			refcount_inc(&barrier->refcount);
			return barrier;
		}
	}

	return NULL;
}

static unsigned long timeout_to_jiffies(signed int timeout_ns)
{
	unsigned long timeout;

	if (timeout_ns <= 0)
		return MAX_SCHEDULE_TIMEOUT;

	timeout = nsecs_to_jiffies((u64)timeout_ns);
	return timeout ? timeout : 1;
}

SYSCALL_DEFINE2(barrier_init, unsigned int, count, signed int, timeout)
{
	struct barrier_entry *barrier;

	if (!count)
		return -EINVAL;

	barrier = kzalloc(sizeof(*barrier), GFP_KERNEL);
	if (!barrier)
		return -ENOMEM;

	barrier->id = atomic_inc_return(&next_barrier_id);
	barrier->tgid = current->tgid;
	barrier->count = count;
	barrier->timeout_ns = timeout;
	init_waitqueue_head(&barrier->waitq);
	mutex_init(&barrier->lock);
	refcount_set(&barrier->refcount, 1);

	mutex_lock(&barrier_list_lock);
	list_add_tail(&barrier->list, &barrier_list);
	mutex_unlock(&barrier_list_lock);

	pr_info("syscall=barrier_init pid=%d process=%s barrier_id=%u count=%u timeout_ns=%d\n",
		current->pid, current->comm, barrier->id, count, timeout);

	return barrier->id;
}

SYSCALL_DEFINE1(barrier_wait, unsigned int, barrier_id)
{
	struct barrier_entry *barrier;
	unsigned int generation;
	unsigned long timeout;
	long wait_result;
	long ret = 0;

	mutex_lock(&barrier_list_lock);
	barrier = find_barrier_get_locked(barrier_id, current->tgid);
	if (!barrier) {
		mutex_unlock(&barrier_list_lock);
		return -EINVAL;
	}

	mutex_lock(&barrier->lock);
	mutex_unlock(&barrier_list_lock);

	generation = barrier->generation;
	barrier->arrived++;

	pr_info("syscall=barrier_wait pid=%d process=%s barrier_id=%u arrived=%u count=%u\n",
		current->pid, current->comm, barrier->id, barrier->arrived, barrier->count);

	if (barrier->arrived == barrier->count) {
		barrier->arrived = 0;
		barrier->generation++;
		wake_up_all(&barrier->waitq);
		mutex_unlock(&barrier->lock);
		barrier_put(barrier);
		return ret;
	}

	mutex_unlock(&barrier->lock);

	timeout = timeout_to_jiffies(barrier->timeout_ns);
	wait_result = wait_event_interruptible_timeout(
		barrier->waitq,
		barrier->generation != generation,
		timeout
	);

	if (wait_result < 0) {
		barrier_put(barrier);
		return wait_result;
	}

	mutex_lock(&barrier->lock);
	if (barrier->generation == generation) {
		if (barrier->arrived > 0)
			barrier->arrived--;
		mutex_unlock(&barrier->lock);
		barrier_put(barrier);
		return -ETIME;
	}

	mutex_unlock(&barrier->lock);
	barrier_put(barrier);
	return ret;
}

SYSCALL_DEFINE1(barrier_destroy, unsigned int, barrier_id)
{
	struct barrier_entry *barrier;

	mutex_lock(&barrier_list_lock);
	barrier = find_barrier_get_locked(barrier_id, current->tgid);
	if (!barrier) {
		mutex_unlock(&barrier_list_lock);
		return -EINVAL;
	}

	mutex_lock(&barrier->lock);
	if (barrier->arrived != 0 || refcount_read(&barrier->refcount) > 2) {
		mutex_unlock(&barrier->lock);
		mutex_unlock(&barrier_list_lock);
		barrier_put(barrier);
		return -EBUSY;
	}

	list_del(&barrier->list);
	mutex_unlock(&barrier->lock);
	mutex_unlock(&barrier_list_lock);

	pr_info("syscall=barrier_destroy pid=%d process=%s barrier_id=%u\n",
		current->pid, current->comm, barrier_id);

	barrier_put(barrier);
	barrier_put(barrier);
	return 0;
}
BARRIER_SYS_C

cat > barrier/Makefile <<'BARRIER_MAKEFILE'
obj-y := barrier_sys.o
BARRIER_MAKEFILE

if ! grep -q "core-y.*barrier/" Makefile; then
  sed -i '0,/^core-y[[:space:]]*+=/{
    /^core-y[[:space:]]*+=/s|$| barrier/|
  }' Makefile
fi

cat >> include/linux/syscalls.h <<'SYSCALL_PROTOTYPES'

asmlinkage long sys_barrier_init(unsigned int count, signed int timeout);
asmlinkage long sys_barrier_wait(unsigned int barrier_id);
asmlinkage long sys_barrier_destroy(unsigned int barrier_id);
SYSCALL_PROTOTYPES

cat >> arch/x86/entry/syscalls/syscall_64.tbl <<SYSCALL64
$next64	common	barrier_init		sys_barrier_init
$((next64 + 1))	common	barrier_wait		sys_barrier_wait
$((next64 + 2))	common	barrier_destroy		sys_barrier_destroy
SYSCALL64

if [ -n "$next32" ]; then
  cat >> arch/x86/entry/syscalls/syscall_32.tbl <<SYSCALL32
$next32	i386	barrier_init		sys_barrier_init
$((next32 + 1))	i386	barrier_wait		sys_barrier_wait
$((next32 + 2))	i386	barrier_destroy		sys_barrier_destroy
SYSCALL32
fi

cat > "$project_kernel_dir/barrier_syscall_numbers.h" <<SYSCALL_NUMBERS
#ifndef BARRIER_SYSCALL_NUMBERS_H
#define BARRIER_SYSCALL_NUMBERS_H

#define __NR_barrier_init $next64
#define __NR_barrier_wait $((next64 + 1))
#define __NR_barrier_destroy $((next64 + 2))

#endif
SYSCALL_NUMBERS

echo "Added barrier syscalls to: $kernel_src"
echo "x86_64 syscall numbers:"
echo "  barrier_init    $next64"
echo "  barrier_wait    $((next64 + 1))"
echo "  barrier_destroy $((next64 + 2))"
echo
echo "Generated: $project_kernel_dir/barrier_syscall_numbers.h"
echo "Build the kernel, reboot into it, then compile user_modern.c."
