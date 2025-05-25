# TickTick TUI

A terminal-based interface (TUI) for TickTick, designed to be a fast, keyboard-friendly alternative to the official GUI.

!\[screenshot placeholder]

## Features

* ✅ Load tasks and project lists (regular lists fully supported)
* ✅ View task details
* ✅ Add new tasks
* ✅ Delete tasks
* ✅ Add quick task via CLI without launching the TUI
* 🚧 Partial support for smart lists
* 🎯 Full keyboard navigation (vim-style: `hjkl` or arrow keys)

## Roadmap

* [ ] Edit tasks from the details pane
* [ ] List tasks by tag
* [ ] Filter/search tasks
* [ ] Change sort order
* [ ] Mark tasks as done
* [ ] Full support for smart lists

## Installation

```bash
npm install -g ticktick-tui
```

## Usage

```bash
ticktick-tui                   # Launch the full TUI
ticktick-tui "Buy milk #errands"  # Quickly add a task from the CLI
ticktick-tui --login           # Log into your TickTick account
ticktick-tui --logout          # Log out and remove session cookies
```

## Keyboard Shortcuts

| Key             | Action                                |
| --------------- | ------------------------------------- |
| `hjkl` / arrows | Move around UI columns/tasks/projects |
| `n`             | Add new task                          |
| `d`             | Delete selected task                  |
| `y/n`           | Confirm/cancel deletion               |
| `esc`           | Cancel input or deletion              |

## Authentication

Login is required on first use:

```bash
ticktick-tui --login
```

This will prompt for your email and password and store session cookies locally.

## Quick Task Add

Add a task directly without opening the TUI:

```bash
ticktick-tui "Finish writing blog post #writing"
```
## Disclaimer

This is an unofficial project and not affiliated with TickTick. Use at your own discretion.
