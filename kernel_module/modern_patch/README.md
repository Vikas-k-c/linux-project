# Modern Barrier Syscall Patch Helper

Use this helper when the old `barrier.patch` does not apply to your current
Ubuntu kernel source.

Run these commands inside the Ubuntu VirtualBox VM.

## 1. Prepare Kernel Source

```bash
sudo apt update
sudo apt install -y git build-essential libncurses-dev bison flex libssl-dev libelf-dev bc dwarves fakeroot rsync patch linux-source

cd ~
mkdir -p kernel-work
cd kernel-work
tar -xf /usr/src/linux-source-*.tar.*
mv linux-source-* kernel
```

## 2. Apply The Modern Barrier Syscall Changes

```bash
cd ~/linux-project
chmod +x kernel_module/modern_patch/apply_barrier_syscalls.sh
./kernel_module/modern_patch/apply_barrier_syscalls.sh ~/kernel-work/kernel
```

The script detects the next free x86_64 syscall numbers and writes them to:

```text
kernel_module/barrier_syscall_numbers.h
```

If you want to create a real patch file from the generated changes, keep a
clean copy before running the script:

```bash
cd ~/kernel-work
cp -a kernel kernel-original

cd ~/linux-project
./kernel_module/modern_patch/apply_barrier_syscalls.sh ~/kernel-work/kernel

cd ~/kernel-work
diff -rNu kernel-original kernel > barrier-modern.patch
```

## 3. Build And Install The Kernel

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

## 4. Build And Run The User Test

After reboot:

```bash
cd ~/linux-project/kernel_module
gcc -o user_modern user_modern.c -pthread -Wall
./user_modern
```

In another terminal, you can watch the kernel messages:

```bash
sudo dmesg --follow --human
```

The generated syscall code prints log lines such as:

```text
syscall=barrier_init
syscall=barrier_wait
syscall=barrier_destroy
```

Those names are readable by the dashboard parser.
