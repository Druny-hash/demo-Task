class TodoItemFormatter {
    formatTask(task) {
        return task.length > 14 ? task.slice(0, 14) + "..." : task;
    }

    formatDueDate(dueDate) {
        return dueDate || "No due date";
    }

    formatStatus(completed) {
        return completed ? "Completed" : "Pending";
    }
}

class TodoManager {
    constructor(todoItemFormatter) {
        this.todos = JSON.parse(localStorage.getItem("todos")) || [];
        this.todoItemFormatter = todoItemFormatter;
    }

    addTodo(task, dueDate, category) {
        const newTodo = {
            id: this.getRandomId(),
            task: this.todoItemFormatter.formatTask(task),
            dueDate: this.todoItemFormatter.formatDueDate(dueDate),
            category: category || "Uncategorized",
            completed: false,
            status: "pending",
        };
        this.todos.push(newTodo);
        this.saveToLocalStorage();
        return newTodo;
    }

    editTodo(id, updatedTask, updatedDueDate) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.task = updatedTask;
            todo.dueDate = updatedDueDate || "No due date";
            this.saveToLocalStorage();
        }
        return todo;
    }

    deleteTodo(id) {
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.saveToLocalStorage();
    }

    toggleTodoStatus(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
        }
    }

    clearAllTodos() {
        if (this.todos.length > 0) {
            this.todos = [];
            this.saveToLocalStorage();
        }
    }

    filterTodos(status) {
        switch (status) {
            case "all":
                return this.todos;
            case "pending":
                return this.todos.filter((todo) => !todo.completed);
            case "completed":
                return this.todos.filter((todo) => todo.completed);
            default:
                return [];
        }
    }

    filterTodosByCategory(category) {
        return this.todos.filter((todo) => todo.category === category);
    }

    getRandomId() {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    saveToLocalStorage() {
        localStorage.setItem("todos", JSON.stringify(this.todos));
    }
}

class UIManager {
    constructor(todoManager, todoItemFormatter) {
        this.todoManager = todoManager;
        this.todoItemFormatter = todoItemFormatter;
        this.taskInput = document.querySelector("input");
        this.dateInput = document.querySelector(".schedule-date");
        this.categorySelect = document.querySelector(".category-select");
        this.addBtn = document.querySelector(".add-task-button");
        this.todosListBody = document.querySelector(".todos-list-body");
        this.alertMessage = document.querySelector(".alert-message");
        this.deleteAllBtn = document.querySelector(".delete-all-btn");
        this.sortCriterion = "default";

        this.addEventListeners();
        this.showAllTodos();
        this.startDueDateNotifications();
    }

    addEventListeners() {
        this.addBtn.addEventListener("click", () => this.handleAddTodo());

        this.taskInput.addEventListener("keyup", (e) => {
            if (e.keyCode === 13 && this.taskInput.value.length > 0) {
                this.handleAddTodo();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter" && this.taskInput.value.length > 0) {
                this.handleAddTodo();
            }
            if (e.ctrlKey && e.shiftKey && e.key === "D") {
                this.showDeleteAllModal();
            }
        });

        this.deleteAllBtn.addEventListener("click", () => this.showDeleteAllModal());

        const confirmDeleteAllBtn = document.querySelector("#confirm-delete-all");
        confirmDeleteAllBtn.addEventListener("click", () => {
            this.handleClearAllTodos();
            document.getElementById("delete-all-modal").checked = false;
        });

        const filterButtons = document.querySelectorAll(".todos-filter li");
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const status = button.textContent.toLowerCase();
                if (["all", "pending", "completed"].includes(status)) {
                    this.handleFilterTodos(status);
                } else {
                    this.handleFilterTodosByCategory(status.charAt(0).toUpperCase() + status.slice(1));
                }
            });
        });

        const sortButtons = document.querySelectorAll(".todos-filter li[onclick^='sortTodos']");
        sortButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const criterion = button.textContent.toLowerCase().replace("by ", "");
                this.handleSortTodos(criterion);
            });
        });
    }

    showDeleteAllModal() {
        const modal = document.getElementById("delete-all-modal");
        modal.checked = true;
    }

    handleAddTodo() {
        const task = this.taskInput.value;
        const dueDate = this.dateInput.value;
        const category = this.categorySelect.value;
        if (task === "") {
            this.showAlertMessage("Please enter a task", "error");
        } else {
            const newTodo = this.todoManager.addTodo(task, dueDate, category);
            this.showAllTodos();
            this.taskInput.value = "";
            this.dateInput.value = "";
            this.categorySelect.value = "Work";
            this.showAlertMessage("Task added successfully", "success");
        }
    }

    handleClearAllTodos() {
        this.todoManager.clearAllTodos();
        this.showAllTodos();
        this.showAlertMessage("All todos cleared successfully", "success");
    }

    showAllTodos() {
        const todos = this.todoManager.filterTodos("all");
        this.displayTodos(todos);
    }

    displayTodos(todos) {
        this.todosListBody.innerHTML = "";

        if (todos.length === 0) {
            this.todosListBody.innerHTML = `<tr><td colspan="5" class="text-center">No task found</td></tr>`;
            return;
        }

        const sortedTodos = [...todos];
        if (this.sortCriterion === "due date") {
            sortedTodos.sort((a, b) => {
                const dateA = a.dueDate === "No due date" ? "9999-12-31" : a.dueDate;
                const dateB = b.dueDate === "No due date" ? "9999-12-31" : b.dueDate;
                return dateA.localeCompare(dateB);
            });
        } else if (this.sortCriterion === "status") {
            sortedTodos.sort((a, b) => a.completed - b.completed);
        } else if (this.sortCriterion === "alphabetical") {
            sortedTodos.sort((a, b) => a.task.localeCompare(b.task));
        }

        sortedTodos.forEach((todo) => {
            const row = document.createElement("tr");
            row.classList.add("todo-item");
            row.dataset.id = todo.id;
            row.innerHTML = `
                <td>${this.todoItemFormatter.formatTask(todo.task)}</td>
                <td>${this.todoItemFormatter.formatDueDate(todo.dueDate)}</td>
                <td>${todo.category}</td>
                <td>${this.todoItemFormatter.formatStatus(todo.completed)}</td>
                <td class="flex gap-1">
                    <button class="btn btn-warning btn-sm" onclick="uiManager.handleEditTodo('${todo.id}')">
                        <i class="bx bx-edit-alt bx-bx-xs"></i>    
                    </button>
                    <button class="btn btn-success btn-sm" onclick="uiManager.handleToggleStatus('${todo.id}')">
                        <i class="bx bx-check bx-xs"></i>
                    </button>
                    <button class="btn btn-error btn-sm" onclick="uiManager.handleDeleteTodo('${todo.id}')">
                        <i class="bx bx-trash bx-xs"></i>
                    </button>
                </td>
            `;
            this.todosListBody.appendChild(row);
        });
    }

    handleEditTodo(id) {
        const todo = this.todoManager.todos.find((t) => t.id === id);
        if (todo) {
            this.taskInput.value = todo.task;
            this.dateInput.value = todo.dueDate === "No due date" ? "" : todo.dueDate;
            this.categorySelect.value = todo.category;

            const handleUpdate = () => {
                const updatedTask = this.taskInput.value;
                const updatedDueDate = this.dateInput.value;
                if (updatedTask) {
                    this.todoManager.editTodo(id, updatedTask, updatedDueDate);
                    this.showAllTodos();
                    this.taskInput.value = "";
                    this.dateInput.value = "";
                    this.categorySelect.value = "Work";
                    this.showAlertMessage("Todo updated successfully", "success");
                    this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
                    this.addBtn.removeEventListener("click", handleUpdate);
                } else {
                    this.showAlertMessage("Task cannot be empty", "error");
                }
            };

            this.addBtn.innerHTML = "<i class='bx bx-check bx-sm'></i>";
            this.addBtn.addEventListener("click", handleUpdate);
        }
    }

    handleToggleStatus(id) {
        this.todoManager.toggleTodoStatus(id);
        this.showAllTodos();
    }

    handleDeleteTodo(id) {
        const row = this.todosListBody.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.add("animate-fade-out");
            setTimeout(() => {
                this.todoManager.deleteTodo(id);
                this.showAllTodos();
                this.showAlertMessage("Todo deleted successfully", "success");
            }, 300);
        }
    }

    handleFilterTodos(status) {
        const filteredTodos = this.todoManager.filterTodos(status);
        this.displayTodos(filteredTodos);
    }

    handleFilterTodosByCategory(category) {
        const filteredTodos = this.todoManager.filterTodosByCategory(category);
        this.displayTodos(filteredTodos);
    }

    handleSortTodos(criterion) {
        this.sortCriterion = criterion;
        this.showAllTodos();
    }

    showAlertMessage(message, type) {
        const alertBox = `
            <div class="alert alert-${type} shadow-lg mb-5 w-full">
                <div>
                    <span>${message}</span>
                </div>
            </div>
        `;
        this.alertMessage.innerHTML = alertBox;
        this.alertMessage.classList.remove("hide");
        this.alertMessage.classList.add("show");
        setTimeout(() => {
            this.alertMessage.classList.remove("show");
            this.alertMessage.classList.add("hide");
        }, 3000);
    }

    startDueDateNotifications() {
        setInterval(() => {
            const today = new Date().toISOString().split("T")[0];
            this.todos.forEach((todo) => {
                if (todo.dueDate !== "No due date" && todo.dueDate === today && !todo.completed) {
                    this.showAlertMessage(`Reminder: Task "${todo.task}" is due today!`, "warning");
                }
            });
        }, 300000);
    }
}

class ThemeSwitcher {
    constructor(themes, html) {
        this.themes = themes;
        this.html = html;
        this.init();
    }

    init() {
        const theme = this.getThemeFromLocalStorage();
        if (theme) {
            this.setTheme(theme);
        }

        this.addThemeEventListeners();
    }

    addThemeEventListeners() {
        this.themes.forEach((theme) => {
            theme.addEventListener("click", () => {
                const themeName = theme.getAttribute("theme");
                this.setTheme(themeName);
                this.saveThemeToLocalStorage(themeName);
            });
        });
    }

    setTheme(themeName) {
        this.html.setAttribute("data-theme", themeName);
    }

    saveThemeToLocalStorage(themeName) {
        localStorage.setItem("theme", themeName);
    }

    getThemeFromLocalStorage() {
        return localStorage.getItem("theme");
    }
}

const todoItemFormatter = new TodoItemFormatter();
const todoManager = new TodoManager(todoItemFormatter);
const uiManager = new UIManager(todoManager, todoItemFormatter);
const themes = document.querySelectorAll(".theme-item");
const html = document.querySelector("html");
const themeSwitcher = new ThemeSwitcher(themes, html);