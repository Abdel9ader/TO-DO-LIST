 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskInput = document.getElementById('task-input');
            const addTaskBtn = document.getElementById('add-task-btn');
            const taskList = document.getElementById('task-list');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const themeToggle = document.getElementById('theme-toggle');
            const clearAllBtn = document.getElementById('clear-all-btn');
            const priorityModal = document.getElementById('priority-modal');
            const priorityOptions = document.querySelectorAll('.priority-option');
            
            // Stats elements
            const totalTasksElement = document.getElementById('total-tasks');
            const completedTasksElement = document.getElementById('completed-tasks');
            const remainingTasksElement = document.getElementById('remaining-tasks');
            const progressFill = document.getElementById('progress-fill');
            
            // State
            let tasks = JSON.parse(localStorage.getItem('taskatk-tasks')) || [];
            let currentFilter = localStorage.getItem('taskatk-filter') || 'all';
            let pendingTaskText = '';
            let taskIdCounter = parseInt(localStorage.getItem('taskatk-counter')) || 1;
            
            // Initialize app
            initTheme();
            createParticles();
            loadInitialFilter(); // Load saved filter
            renderTasks();
            updateStats();
            
            // Event Listeners
            addTaskBtn.addEventListener('click', () => showPriorityModal(taskInput.value.trim()));
            taskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const text = taskInput.value.trim();
                    if (text) showPriorityModal(text);
                }
            });
            
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    currentFilter = button.dataset.filter;
                    localStorage.setItem('taskatk-filter', currentFilter);
                    renderTasks();
                });
            });
            
            themeToggle.addEventListener('click', toggleTheme);
            clearAllBtn.addEventListener('click', clearAllTasks);
            
            // Priority modal events
            priorityOptions.forEach(option => {
                option.addEventListener('click', () => {
                    if (pendingTaskText) {
                        addTask(pendingTaskText, option.dataset.priority);
                        closePriorityModal();
                    }
                });
            });
            
            priorityModal.addEventListener('click', (e) => {
                if (e.target === priorityModal) closePriorityModal();
            });
            
            // Functions
            function showPriorityModal(text) {
                if (!text) return;
                pendingTaskText = text;
                priorityModal.classList.add('show');
            }
            
            function closePriorityModal() {
                priorityModal.classList.remove('show');
                pendingTaskText = '';
            }
            
            function addTask(text, priority = 'medium') {
                if (!text) return;
                
                const newTask = {
                    id: taskIdCounter++,
                    text,
                    completed: false,
                    priority,
                    createdAt: new Date().toISOString()
                };
                
                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                updateStats();
                
                taskInput.value = '';
                taskInput.focus();
                
                // Add celebration effect for first task
                if (tasks.length === 1) {
                    showCelebration('🎉');
                }
            }
            
            function renderTasks() {
                taskList.innerHTML = '';
                
                let filteredTasks = filterTasks();
                
                if (filteredTasks.length === 0) {
                    const emptyState = document.createElement('li');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <div>No ${currentFilter === 'all' ? '' : currentFilter} tasks found</div>
                        <div style="margin-top: 10px; font-size: 0.9rem;">
                            ${currentFilter === 'all' ? 'Add a task to get started!' : 'Try a different filter'}
                        </div>
                    `;
                    taskList.appendChild(emptyState);
                    return;
                }
                
                filteredTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            }
            
            function createTaskElement(task) {
                const taskElement = document.createElement('li');
                taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
                taskElement.dataset.id = task.id;
                
                taskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    <div class="task-actions">
                        <button class="action-btn priority-btn" title="Change priority">
                            <i class="fas fa-flag"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add event listeners
                const checkbox = taskElement.querySelector('.task-checkbox');
                const editBtn = taskElement.querySelector('.edit-btn');
                const deleteBtn = taskElement.querySelector('.delete-btn');
                const priorityBtn = taskElement.querySelector('.priority-btn');
                
                checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
                editBtn.addEventListener('click', () => editTask(task.id));
                priorityBtn.addEventListener('click', () => changePriority(task.id));
                
                return taskElement;
            }
            
            function filterTasks() {
                switch (currentFilter) {
                    case 'active':
                        return tasks.filter(task => !task.completed);
                    case 'completed':
                        return tasks.filter(task => task.completed);
                    case 'high':
                        return tasks.filter(task => task.priority === 'high');
                    default:
                        return tasks;
                }
            }
            
            function toggleTaskComplete(id) {
                const task = tasks.find(t => t.id === id);
                if (!task) return;
                
                task.completed = !task.completed;
                
                // Update UI immediately
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                if (taskElement) {
                    const checkbox = taskElement.querySelector('.task-checkbox');
                    const taskText = taskElement.querySelector('.task-text');
                    
                    checkbox.checked = task.completed;
                    taskText.classList.toggle('completed', task.completed);
                    taskElement.classList.toggle('completed', task.completed);
                }
                
                saveTasks();
                updateStats();
                
                if (task.completed) {
                    showCelebration('✅');
                    setTimeout(() => checkAllCompleted(), 100);
                }
            }
            
            function deleteTask(id) {
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                if (taskElement) {
                    taskElement.classList.add('fade-out');
                    setTimeout(() => {
                        tasks = tasks.filter(task => task.id !== id);
                        saveTasks();
                        renderTasks();
                        updateStats();
                    }, 500);
                }
            }
            
            function editTask(id) {
                const task = tasks.find(t => t.id === id);
                if (!task) return;
                
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                const taskTextElement = taskElement.querySelector('.task-text');
                const originalText = task.text;
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.text;
                input.className = 'edit-input';
                input.style.cssText = `
                    flex: 1; padding: 8px 12px; font-size: 1.15rem; 
                    border: 2px solid var(--primary-color); 
                    border-radius: 8px; background: var(--card-color); 
                    color: var(--text-color); font-weight: 500;
                `;
                
                taskTextElement.replaceWith(input);
                input.focus();
                input.select();
                
                function saveEdit() {
                    const newText = input.value.trim();
                    if (newText && newText !== originalText) {
                        task.text = newText;
                        taskTextElement.textContent = newText;
                        saveTasks();
                    }
                    input.replaceWith(taskTextElement);
                    updateStats();
                }
                
                function cancelEdit() {
                    input.replaceWith(taskTextElement);
                }
                
                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveEdit();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });
            }
            
            function changePriority(id) {
                const task = tasks.find(t => t.id === id);
                if (!task) return;
                
                const priorities = ['low', 'medium', 'high'];
                const currentIndex = priorities.indexOf(task.priority);
                const nextIndex = (currentIndex + 1) % priorities.length;
                
                task.priority = priorities[nextIndex];
                
                // Update just this task element instead of re-rendering all
                const taskElement = document.querySelector(`[data-id="${id}"]`);
                if (taskElement) {
                    const priorityElement = taskElement.querySelector('.task-priority');
                    priorityElement.className = `task-priority priority-${task.priority}`;
                    priorityElement.textContent = task.priority;
                }
                
                saveTasks();
                updateStats();
                showCelebration('🏆');
            }
            
            function clearAllTasks() {
                if (tasks.length === 0) return;
                
                if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
                    // Add fade out animation to all tasks
                    const taskElements = document.querySelectorAll('.task-item');
                    taskElements.forEach((element, index) => {
                        setTimeout(() => {
                            element.classList.add('fade-out');
                        }, index * 100);
                    });
                    
                    setTimeout(() => {
                        tasks = [];
                        saveTasks();
                        renderTasks();
                        updateStats();
                        showCelebration('🗑️');
                    }, taskElements.length * 100 + 500);
                }
            }
            
            function updateStats() {
                const total = tasks.length;
                const completed = tasks.filter(t => t.completed).length;
                const remaining = total - completed;
                const progressPercentage = total === 0 ? 0 : (completed / total) * 100;
                
                // Update numbers directly without animation to prevent issues
                totalTasksElement.textContent = total;
                completedTasksElement.textContent = completed;
                remainingTasksElement.textContent = remaining;
                
                // Update progress bar with smooth animation
                requestAnimationFrame(() => {
                    progressFill.style.width = progressPercentage + '%';
                });
            }
            
            // Remove the problematic animateNumber function
            // Stats now update directly without animation issues
            
            function checkAllCompleted() {
                const allCompleted = tasks.length > 0 && tasks.every(task => task.completed);
                if (allCompleted) {
                    setTimeout(() => {
                        showCelebration('🎉 All Done! 🎉');
                    }, 500);
                }
            }
            
            function showCelebration(emoji) {
                const celebration = document.createElement('div');
                celebration.className = 'celebration';
                celebration.textContent = emoji;
                document.body.appendChild(celebration);
                
                setTimeout(() => {
                    document.body.removeChild(celebration);
                }, 2000);
            }
            
            function initTheme() {
                const savedTheme = localStorage.getItem('taskatk-theme') || 'light';
                applyTheme(savedTheme);
                updateThemeIcon(savedTheme);
            }
            
            function toggleTheme() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                applyTheme(newTheme);
                updateThemeIcon(newTheme);
                localStorage.setItem('taskatk-theme', newTheme);
                
                // Recreate particles for theme change
                setTimeout(createParticles, 300);
            }
            
            function applyTheme(theme) {
                document.documentElement.setAttribute('data-theme', theme);
            }
            
            function updateThemeIcon(theme) {
                const icon = themeToggle.querySelector('i');
                icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            
            function createParticles() {
                const particlesContainer = document.getElementById('particles');
                particlesContainer.innerHTML = '';
                
                const particleCount = window.innerWidth < 768 ? 15 : 25;
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 6 + 's';
                    particle.style.animationDuration = (3 + Math.random() * 3) + 's';
                    particlesContainer.appendChild(particle);
                }
            }
            
            // Storage functions
            function saveTasks() {
                try {
                    localStorage.setItem('taskatk-tasks', JSON.stringify(tasks));
                    localStorage.setItem('taskatk-counter', taskIdCounter.toString());
                    
                    // Auto-save indicator (optional visual feedback)
                    showAutoSaveIndicator();
                } catch (error) {
                    console.error('Failed to save tasks to localStorage:', error);
                    showError('Failed to save tasks. Storage might be full.');
                }
            }
            
            function showAutoSaveIndicator() {
                // Create a subtle save indicator
                const indicator = document.createElement('div');
                indicator.textContent = '✓ Saved';
                indicator.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                    background: var(--success-color); color: white; padding: 8px 16px;
                    border-radius: 20px; font-size: 0.9rem; font-weight: 600;
                    opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
                `;
                
                document.body.appendChild(indicator);
                
                // Fade in
                requestAnimationFrame(() => {
                    indicator.style.opacity = '1';
                });
                
                // Fade out and remove
                setTimeout(() => {
                    indicator.style.opacity = '0';
                    setTimeout(() => {
                        if (document.body.contains(indicator)) {
                            document.body.removeChild(indicator);
                        }
                    }, 300);
                }, 1000);
            }
            
            function showError(message) {
                const error = document.createElement('div');
                error.textContent = message;
                error.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                    background: var(--danger-color); color: white; padding: 12px 20px;
                    border-radius: 8px; font-size: 1rem; font-weight: 600;
                    box-shadow: var(--shadow); max-width: 300px;
                `;
                
                document.body.appendChild(error);
                
                setTimeout(() => {
                    if (document.body.contains(error)) {
                        document.body.removeChild(error);
                    }
                }, 5000);
            }
            
            function loadInitialFilter() {
                // Set the initial filter state
                const savedFilter = localStorage.getItem('taskatk-filter') || 'all';
                const filterBtn = document.querySelector(`[data-filter="${savedFilter}"]`);
                if (filterBtn) {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    filterBtn.classList.add('active');
                    currentFilter = savedFilter;
                }
            }
            
            // Keyboard shortcuts with localStorage support
            document.addEventListener('keydown', function(e) {
                // Ctrl/Cmd + Enter to add task quickly
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    const text = taskInput.value.trim();
                    if (text) {
                        addTask(text, 'medium');
                        taskInput.value = '';
                    }
                }
                
                // Escape to close modal
                if (e.key === 'Escape') {
                    closePriorityModal();
                }
                
                // Alt + T to focus task input
                if (e.altKey && e.key === 't') {
                    e.preventDefault();
                    taskInput.focus();
                }
                
                // Alt + C to clear completed tasks
                if (e.altKey && e.key === 'c') {
                    e.preventDefault();
                    const completedTasks = tasks.filter(t => t.completed);
                    if (completedTasks.length > 0) {
                        if (confirm(`Clear ${completedTasks.length} completed tasks?`)) {
                            tasks = tasks.filter(t => !t.completed);
                            saveTasks();
                            renderTasks();
                            updateStats();
                        }
                    }
                }
                
                // Ctrl/Cmd + S to manually save (shows save indicator)
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    saveTasks();
                }
            });
            
            // Auto-save functionality with real persistence
            setInterval(() => {
                if (tasks.length > 0) {
                    // Silent save - no indicator for periodic saves
                    try {
                        localStorage.setItem('taskatk-tasks', JSON.stringify(tasks));
                        localStorage.setItem('taskatk-counter', taskIdCounter.toString());
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                    }
                }
            }, 30000); // Auto-save every 30 seconds
            
            // Save on page unload
            window.addEventListener('beforeunload', () => {
                try {
                    localStorage.setItem('taskatk-tasks', JSON.stringify(tasks));
                    localStorage.setItem('taskatk-counter', taskIdCounter.toString());
                    localStorage.setItem('taskatk-filter', currentFilter);
                } catch (error) {
                    console.error('Failed to save on unload:', error);
                }
            });
            
            // Add some sample tasks for demo - REMOVED FOR DYNAMIC VERSION
            // Application starts completely empty for full dynamic experience
            
            // Focus input on load
            setTimeout(() => {
                taskInput.focus();
            }, 500);
            
            // Responsive particle adjustment
            window.addEventListener('resize', () => {
                setTimeout(createParticles, 100);
            });
            
            // Focus management
            taskInput.addEventListener('focus', () => {
                taskInput.parentElement.style.transform = 'scale(1.02)';
            });
            
            taskInput.addEventListener('blur', () => {
                taskInput.parentElement.style.transform = 'scale(1)';
            });
            
            // Task input enhancements
            let inputTimeout;
            taskInput.addEventListener('input', () => {
                clearTimeout(inputTimeout);
                const length = taskInput.value.length;
                
                if (length > 150) {
                    taskInput.style.borderColor = 'var(--warning-color)';
                } else if (length > 180) {
                    taskInput.style.borderColor = 'var(--danger-color)';
                } else {
                    taskInput.style.borderColor = 'var(--primary-color)';
                }
                
                // Auto-expand functionality could be added here
                inputTimeout = setTimeout(() => {
                    if (length > 0) {
                        addTaskBtn.style.transform = 'scale(1.1)';
                    } else {
                        addTaskBtn.style.transform = 'scale(1)';
                    }
                }, 300);
            });
        });
