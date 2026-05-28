# Linux Project - System Call Monitoring Dashboard

This repository contains a Linux system call monitoring dashboard plus the
original Project 4 kernel module files.

All Project 4 files are inside the `kernel_module/` folder:

```text
kernel_module/
|-- barrier.patch
|-- Makefile
|-- README.md
`-- user.c
```

The `backend/` and `frontend/` folders contain the dashboard application. The
kernel module files are kept separate and unchanged inside `kernel_module/`.

## Folder Structure

```text
linux-project/
|-- kernel_module/   # All Project 4 files
|-- backend/         # Express + Socket.IO backend
|-- frontend/        # Vite + React dashboard
`-- README.md
```

## Run The Dashboard On Linux

Install Node.js and npm first:

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

Open a second terminal and start the frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the app in your browser:

```text
http://localhost:5173
```

On Linux, the backend reads kernel logs using:

```bash
dmesg --follow --human
```

If Linux blocks access to `dmesg`, run the backend with `sudo` for testing:

```bash
sudo npm run dev
```

Or temporarily allow kernel log access in a demo environment:

```bash
sudo sysctl kernel.dmesg_restrict=0
```

## Run In Demo Mode

If you only want to show the dashboard without real kernel logs, force mock mode:

```bash
cd backend
FORCE_MOCK=true npm run dev
```

Then run the frontend normally from the `frontend/` folder.

## Project 4 Kernel Module Files

The original Project 4 instructions are in:

```text
kernel_module/README.md
```

That folder contains the patch and user test program for the custom barrier
system calls:

- `barrier.patch` applies the syscall changes to the Linux kernel source.
- `user.c` is the user-space test program.
- `Makefile` builds the user test program for the original Project 4 target.

## Build And Test Project 4 On Linux

Go to the Project 4 folder:

```bash
cd kernel_module
```

Read the original module instructions:

```bash
cat README.md
```

The usual flow is:

1. Copy or place the Linux kernel source on your Linux system.
2. Apply `barrier.patch` to the kernel source.
3. Build the patched kernel.
4. Boot into the patched kernel.
5. Compile and run `user.c` to test the new system calls.

Example patch command from the kernel source parent directory:

```bash
patch -p0 < kernel_module/barrier.patch
```

For the original Intel Galileo / Poky SDK target, make sure the SDK path in
`kernel_module/Makefile` is correct:

```makefile
IOT_HOME = /opt/iot-devkit/1.7.2/sysroots
```

Then build the user test program:

```bash
cd kernel_module
make
```

This creates:

```text
user.o
```

After booting into the patched kernel, copy `user.o` to the target Linux system
and run it:

```bash
./user.o
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

Clean the Project 4 build output:

```bash
cd kernel_module
make clean
```

## Notes

- Do not upload `.env` files to GitHub. Use `.env.example` as the template.
- `node_modules/` and `dist/` are ignored by Git.
- The dashboard can run without the kernel patch by using demo mode.
- Real syscall testing requires a Linux kernel that has been patched and booted
  with the Project 4 changes.
