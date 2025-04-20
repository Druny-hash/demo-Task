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

    // Placeholder for backend implementation
    /*
    To add a backend for data persistence:
    1. Set up a Node.js/Express server with a database (e.g., SQLite or MongoDB).
    2. Create API endpoints for CRUD operations (e.g., GET /todos, POST /todos, PUT /todos/:id, DELETE /todos/:id).
    3. Replace localStorage with Fetch API calls in this class. Example:
       async fetchTodos() {
           const response = await fetch('http://localhost:3000/todos');
           this.todos = await response.json();
       }
       async addTodo(task, dueDate, category) {
           const response = await fetch('http://localhost:3000/todos', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ task, dueDate, category, completed: false }),
           });
           const newTodo = await response.json();
           this.todos.push(newTodo);
       }
    */
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
        this.sortCriterion = "default"; // Default sorting

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

        this.deleteAllBtn.addEventListener("click", () => this.handleClearAllTodos());

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

        // Sort todos based on the selected criterion
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
                <td>
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
            row.classList.add("removing");
            row.addEventListener("animationend", () => {
                this.todoManager.deleteTodo(id);
                this.showAllTodos();
                this.showAlertMessage("Todo deleted successfully", "success");
            });
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
        }, 60000); // Check every minute
    }

    // Placeholder for unit tests
    /*
    To add unit tests with Jest:
    1. Initialize a Node.js project: `npm init -y`.
    2. Install Jest: `npm install --save-dev jest`.
    3. Create a test file (e.g., `todoManager.test.js`) and write tests. Example:
       const TodoManager = require('./main.js').TodoManager;
       test('adds a todo', () => {
           const formatter = { formatTask: (t) => t, formatDueDate: (d) => d || "No due date", formatStatus: (c) => c ? "Completed" : "Pending" };
           const manager = new TodoManager(formatter);
           const todo = manager.addTodo("Test task", "2025-04-20", "Work");
           expect(todo.task).toBe("Test task");
       });
    4. Run tests: `npx jest`.
    */
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