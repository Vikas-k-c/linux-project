#include <errno.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

#include "barrier_syscall_numbers.h"

#define barrier_init(count, timeout) syscall(__NR_barrier_init, count, timeout)
#define barrier_wait(id) syscall(__NR_barrier_wait, id)
#define barrier_destroy(id) syscall(__NR_barrier_destroy, id)

static int sync_num;

static void *thread_fn(void *ptr)
{
	unsigned int *barrier_id = ptr;
	int i;

	for (i = 0; i < sync_num; i++) {
		usleep(rand() % 5);
		if (barrier_wait(*barrier_id) < 0)
			perror("barrier_wait");
	}

	return NULL;
}

static int run_child(unsigned int thread_count, pthread_t threads[],
		     unsigned int *barrier_id, unsigned int timeout)
{
	unsigned int i;
	long id;

	id = barrier_init(thread_count, timeout);
	if (id < 0) {
		perror("barrier_init");
		return -1;
	}
	*barrier_id = (unsigned int)id;

	for (i = 0; i < thread_count; i++) {
		if (pthread_create(&threads[i], NULL, thread_fn, barrier_id) != 0) {
			perror("pthread_create");
			return -1;
		}
	}

	return 0;
}

static int child_process(unsigned int timeout)
{
	pthread_t threads[25];
	unsigned int barrier1;
	unsigned int barrier2;
	int i;

	if (run_child(20, &threads[0], &barrier1, timeout) < 0)
		return -1;

	if (run_child(5, &threads[20], &barrier2, timeout) < 0)
		return -1;

	for (i = 0; i < 25; i++)
		pthread_join(threads[i], NULL);

	if (barrier_destroy(barrier1) < 0)
		perror("barrier_destroy barrier1");

	if (barrier_destroy(barrier2) < 0)
		perror("barrier_destroy barrier2");

	return 0;
}

int main(void)
{
	unsigned int timeout;
	int status;
	pid_t child1;
	pid_t child2;
	pid_t finished;

	printf("enter the timeout value in ns: ");
	if (scanf("%u", &timeout) != 1)
		return 1;

	printf("enter no. of synchronisations: ");
	if (scanf("%d", &sync_num) != 1)
		return 1;

	srand(time(NULL));

	child1 = fork();
	if (child1 == 0)
		return child_process(timeout);
	if (child1 < 0) {
		perror("fork child1");
		return 1;
	}

	child2 = fork();
	if (child2 == 0)
		return child_process(timeout);
	if (child2 < 0) {
		perror("fork child2");
		return 1;
	}

	printf("Parent process pid: %d\n", getpid());

	finished = wait(&status);
	printf("Child process %d finished\n", finished);

	finished = wait(&status);
	printf("Child process %d finished\n", finished);

	return 0;
}
