import { createStore } from "https://cdn.jsdelivr.net/npm/redux@4.2.1/es/redux.mjs";

// Reducer for managing tasks
const initialState = { tasks: [] };

function taskReducer(state = initialState, action) {
    switch (action.type) {
        case "SET_TASKS":
            return { ...state, tasks: action.payload };
        case "ADD_TASK":
            return { ...state, tasks: [...state.tasks, action.payload] };
        case "TOGGLE_TASK":
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload ? { ...task, completed: !task.completed } : task
                ),
            };
        case "DELETE_TASK":
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== action.payload),
            };
        default:
            return state;
    }
}

// Create Redux Store
const store = createStore(taskReducer);

// Connect Redux to DOM
const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const taskForm = document.getElementById("taskForm");
const filter = document.getElementById("filter");

// Fetch tasks from API and store them in Redux
async function fetchTasks() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=10");
        const data = await response.json();
        store.dispatch({ type: "SET_TASKS", payload: data });
        renderTasks();
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

// Render tasks in the UI
function renderTasks() {
    const { tasks } = store.getState();
    
    const filteredTasks = tasks.filter(task => {
        if (filter.value === "completed") return task.completed;
        if (filter.value === "pending") return !task.completed;
        return true;
    });

    taskList.innerHTML = "";
    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            <button onclick="toggleTask(${task.id})">Toggle</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
        `;
        taskList.appendChild(li);
    });
}

// Add a new task
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();

    if (title.length < 5) {
        alert("Task must be at least 5 characters long!");
        return;
    }

    const newTask = { id: Date.now(), title, completed: false };
    store.dispatch({ type: "ADD_TASK", payload: newTask });

    taskInput.value = "";
    renderTasks();
});

// Toggle task completion status
window.toggleTask = (taskId) => {
    store.dispatch({ type: "TOGGLE_TASK", payload: taskId });
    renderTasks();
};

// Delete a task
window.deleteTask = (taskId) => {
    store.dispatch({ type: "DELETE_TASK", payload: taskId });
    renderTasks();
};

// Refresh task list when filter changes
filter.addEventListener("change", renderTasks);

// Load tasks when the app starts
fetchTasks();
