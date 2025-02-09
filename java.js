const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const progressBar = document.querySelector(".progress");

document.addEventListener("DOMContentLoaded", loadTasks);

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addTask();
  }
});

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") {
    alert("Task cannot be empty!");
    return;
  }

  const li = document.createElement("li");
  li.innerHTML = `
        <span>${taskText}</span>
        <div>
            <button class="complete">✔️</button>
            <button class="edit">✏️</button>
            <button class="delete">🗑️</button>
        </div>
    `;

  taskList.appendChild(li);

  saveTasks();

  taskInput.value = "";

  updateProgress();

  li.querySelector(".complete").addEventListener("click", completeTask);
  li.querySelector(".edit").addEventListener("click", editTask);
  li.querySelector(".delete").addEventListener("click", deleteTask);
}

function completeTask(e) {
  const li = e.target.closest("li");
  li.classList.toggle("completed");
  saveTasks();
  updateProgress();
}

function editTask(e) {
  const li = e.target.closest("li");
  const span = li.querySelector("span");
  const newText = prompt("Edit your task:", span.textContent);

  if (newText !== null && newText.trim() !== "") {
    span.textContent = newText.trim();
    saveTasks();
  } else if (newText !== null) {
    alert("Task cannot be empty!");
  }
}

function deleteTask(e) {
  const li = e.target.closest("li");
  li.remove();
  saveTasks();
  updateProgress();
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll("li").forEach((li) => {
    tasks.push({
      text: li.querySelector("span").textContent,
      completed: li.classList.contains("completed"),
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <span>${task.text}</span>
            <div>
                <button class="complete">✔️</button>
                <button class="edit">✏️</button>
                <button class="delete">🗑️</button>
            </div>
        `;
    if (task.completed) {
      li.classList.add("completed");
    }
    taskList.appendChild(li);

    li.querySelector(".complete").addEventListener("click", completeTask);
    li.querySelector(".edit").addEventListener("click", editTask);
    li.querySelector(".delete").addEventListener("click", deleteTask);
  });
  updateProgress();
}

function updateProgress() {
  const totalTasks = taskList.children.length;
  const completedTasks = taskList.querySelectorAll(".completed").length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;
  progressBar.style.width = `${progress}%`;
}
