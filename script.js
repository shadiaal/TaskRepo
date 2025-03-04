import { createStore } from "https://cdn.jsdelivr.net/npm/redux@4.2.1/es/redux.mjs";

// Check for previously saved tasks in localStorage
const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

const initialState = { tasks: savedTasks };

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
        case "REORDER_TASKS":
            return { ...state, tasks: action.payload };
        default:
            return state;
    }
}

const store = createStore(taskReducer);

const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const taskForm = document.getElementById("taskForm");
const filter = document.getElementById("filter");

// Update localStorage on every state change
store.subscribe(() => {
    localStorage.setItem("tasks", JSON.stringify(store.getState().tasks));
});

// Fetch tasks from API only if not found in localStorage
async function fetchTasks() {
    if (savedTasks.length === 0) {
        try {
            const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=10");
            const data = await response.json();
            store.dispatch({ type: "SET_TASKS", payload: data });
           
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }
    renderTasks();
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
    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.setAttribute("draggable", true);
        li.dataset.index = index;
        li.innerHTML = `
            <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            <button onclick="toggleTask(${task.id})">Toggle</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
        `;

        // Add drag-and-drop event listeners
        li.addEventListener("dragstart", dragStart);
        li.addEventListener("dragover", dragOver);
        li.addEventListener("drop", drop);

        taskList.appendChild(li);
    });
}

// Add new task
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

// Toggle task completion
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

// Drag-and-Drop Functionality for Task Reordering
let draggedItemIndex = null;

function dragStart(e) {
    draggedItemIndex = e.target.dataset.index;
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    const droppedItemIndex = e.target.dataset.index;
    if (draggedItemIndex !== null && droppedItemIndex !== null) {
        let tasks = [...store.getState().tasks];
        const draggedTask = tasks.splice(draggedItemIndex, 1)[0];
        tasks.splice(droppedItemIndex, 0, draggedTask);

        store.dispatch({ type: "REORDER_TASKS", payload: tasks });
        renderTasks();
    }
}

fetchTasks();
