# Linux System Call Monitoring Dashboard

This project contains two connected parts:

1. A Linux kernel syscall project that adds custom barrier synchronization
   system calls.
2. A React + Express dashboard that reads kernel logs and displays syscall
   activity live.

The custom barrier system calls are implemented by patching and rebuilding a
Linux kernel. The dashboard can either read real kernel logs through `dmesg` on
Linux or run in mock/demo mode without a patched kernel.

## Folder Structure

```text
linux-project/
|-- backend/         # Express + Socket.IO API that reads kernel logs
|-- frontend/        # Vite + React dashboard UI
|-- kernel_module/   # Barrier syscall helper, user test, and docs
`-- README.md
```

## Kernel Barrier Project

The kernel project adds three custom system calls:

| System call | Purpose |
| --- | --- |
| `barrier_init(count, timeout)` | Creates a barrier and returns its barrier ID. |
| `barrier_wait(barrier_id)` | Waits until the required number of threads reach the barrier. |
| `barrier_destroy(barrier_id)` | Destroys a barrier when it is not busy. |

The modern workflow is documented in:

```text
kernel_module/README.md
```

Important files:

| File | Description |
| --- | --- |
| `kernel_module/modern_patch/apply_barrier_syscalls.sh` | Applies the custom syscall code to a Linux kernel source tree. |
| `kernel_module/user_modern.c` | User-space test program for the new syscalls. |
| `kernel_module/barrier_syscall_numbers.h` | Generated syscall numbers used by `user_modern.c`. |
| `kernel_module/barrier.patch` | Older legacy patch kept for reference. |

## Build The Patched Kernel

Run these commands inside the Ubuntu VM/Linux machine where you will build the
kernel:

```bash
sudo apt update
sudo apt install -y git build-essential libncurses-dev bison flex libssl-dev libelf-dev bc dwarves fakeroot rsync patch linux-source

cd ~
mkdir -p kernel-work
cd kernel-work
tar -xf /usr/src/linux-source-*.tar.*
mv linux-source-* kernel
```

Apply the barrier syscall changes from this project:

```bash
cd ~/linux-project
chmod +x kernel_module/modern_patch/apply_barrier_syscalls.sh
./kernel_module/modern_patch/apply_barrier_syscalls.sh ~/kernel-work/kernel
```

Build and install the patched kernel:

```bash
cd ~/kernel-work/kernel
cp /boot/config-$(uname -r) .config
make olddefconfig

scripts/config --disable SYSTEM_TRUSTED_KEYS
scripts/config --disable SYSTEM_REVOCATION_KEYS
make olddefconfig

make -j$(nproc)
sudo make modules_install
sudo make install
sudo update-grub
sudo reboot
```

Kernel builds can take a long time in a VM. If the build has been running for a
while, use `top` in another terminal and check that `gcc`, `cc1`, `ld`, or
`make` is still using CPU.

Warnings from unrelated kernel drivers, such as WireGuard frame-size warnings,
do not mean the barrier syscall project failed. Continue unless the build stops
with an error.

## Test The Custom Syscalls

After rebooting into the patched kernel:

```bash
cd ~/linux-project/kernel_module
gcc -o user_modern user_modern.c -pthread -Wall
./user_modern
```

The test program asks for:

| Input | Meaning |
| --- | --- |
| Timeout value in ns | Timeout passed to `barrier_init`; use `0` for no timeout. |
| Number of synchronisations | Number of times each thread calls `barrier_wait`. |

To watch kernel logs directly:

```bash
sudo dmesg --follow --human
```

Expected log entries include:

```text
syscall=barrier_init
syscall=barrier_wait
syscall=barrier_destroy
```

These log fields are also what the dashboard backend parses.

## Run The Dashboard With Real Kernel Logs

Install Node.js and npm:

```bash
sudo apt update
sudo apt install nodejs npm
```

Start the backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the dashboard:

```text
http://localhost:5173
```

On Linux, the backend reads kernel messages using:

```bash
dmesg --follow --human
```

If access to `dmesg` is blocked during testing, run the backend with elevated
permissions:

```bash
cd backend
sudo npm run dev
```

Or temporarily allow kernel log access in a demo environment:

```bash
sudo sysctl kernel.dmesg_restrict=0
```

## Run The Dashboard In Demo Mode

Demo mode is useful when you want to show the dashboard without rebuilding or
booting into a patched kernel.

```bash
cd backend
FORCE_MOCK=true npm run dev
```

Then run the frontend normally:

```bash
cd frontend
npm run dev
```

## Useful Commands

Backend production start:

```bash
cd backend
npm start
```

Frontend production build:

```bash
cd frontend
npm run build
```

Compile the modern user syscall test:

```bash
cd kernel_module
gcc -o user_modern user_modern.c -pthread -Wall
```

## Troubleshooting

### `barrier_syscall_numbers.h` is missing

Run the modern patch helper again:

```bash
cd ~/linux-project
./kernel_module/modern_patch/apply_barrier_syscalls.sh ~/kernel-work/kernel
```

### `barrier_init: Function not implemented`

You are not running the patched kernel. Reboot, select the newly installed
kernel if needed, and verify:

```bash
uname -r
```

### Dashboard shows no real logs

Check whether `dmesg` is readable:

```bash
dmesg --follow --human
```

If it prints a permission error, use `sudo npm run dev` for the backend during
testing or temporarily set `kernel.dmesg_restrict=0`.

### Kernel build is slow

Use:

```bash
make -j$(nproc)
```

For VirtualBox, give the VM more CPU cores and RAM if possible, and keep the
kernel source on the VM disk rather than a shared folder.

## Notes

- Do not commit `.env` files. Use `.env.example` as the template.
- `node_modules/` and frontend build output are ignored by Git.
- The dashboard can run without the patched kernel by using demo mode.
- Real syscall testing requires booting into the kernel patched by
  `apply_barrier_syscalls.sh`.
