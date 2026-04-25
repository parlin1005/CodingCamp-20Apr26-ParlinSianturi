/**
 * To-Do List Life Dashboard - Main Application
 * A productivity dashboard with time display, focus timer, task management, and quick links
 */

// Application state and configuration
const APP_CONFIG = {
  TIMER_DURATION: 25 * 60, // 25 minutes in seconds
  STORAGE_KEYS: {
    TASKS: 'todo-dashboard-tasks',
    LINKS: 'todo-dashboard-links',
    SETTINGS: 'todo-dashboard-settings'
  },
  UPDATE_INTERVALS: {
    TIME: 1000, // Update time every second
    TIMER: 1000  // Update timer every second
  }
};

/**
 * Storage Provider - Handles Local Storage operations with error handling
 */
class StorageProvider {
  constructor() {
    this.available = this.checkAvailability();
  }

  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('Local Storage not available:', e);
      return false;
    }
  }

  save(key, data) {
    if (!this.available) {
      console.warn('Storage not available, data will not persist');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save data:', e);
      return false;
    }
  }

  load(key) {
    if (!this.available) {
      return null;
    }

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load data:', e);
      return null;
    }
  }

  remove(key) {
    if (!this.available) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Failed to remove data:', e);
      return false;
    }
  }

  isAvailable() {
    return this.available;
  }
}

/**
 * Time Display Component - Shows current time, date, and contextual greeting
 */
class TimeDisplay {
  constructor(containerElement) {
    this.container = containerElement;
    this.intervalId = null;
    this.init();
  }

  init() {
    this.render();
    this.start();
  }

  start() {
    this.update();
    this.intervalId = setInterval(() => this.update(), APP_CONFIG.UPDATE_INTERVALS.TIME);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  update() {
    const now = new Date();
    const timeElement = this.container.querySelector('.current-time');
    const dateElement = this.container.querySelector('.current-date');
    const greetingElement = this.container.querySelector('.greeting');

    if (timeElement) timeElement.textContent = this.formatTime(now);
    if (dateElement) dateElement.textContent = this.formatDate(now);
    if (greetingElement) greetingElement.textContent = this.getCurrentGreeting(now);
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentGreeting(date = new Date()) {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  render() {
    const now = new Date();
    this.container.innerHTML = `
      <div class="current-time">${this.formatTime(now)}</div>
      <div class="current-date">${this.formatDate(now)}</div>
      <div class="greeting">${this.getCurrentGreeting(now)}</div>
    `;
  }
}

/**
 * Focus Timer Component - 25-minute Pomodoro-style timer
 */
class FocusTimer {
  constructor(containerElement) {
    this.container = containerElement;
    this.duration = APP_CONFIG.TIMER_DURATION;
    this.remaining = this.duration;
    this.status = 'IDLE'; // IDLE, RUNNING, PAUSED, COMPLETED
    this.intervalId = null;
    this.completionCallbacks = [];
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  start() {
    if (this.status === 'COMPLETED') return false;
    
    this.status = 'RUNNING';
    this.intervalId = setInterval(() => this.tick(), APP_CONFIG.UPDATE_INTERVALS.TIMER);
    this.updateControls();
    return true;
  }

  stop() {
    this.status = 'PAUSED';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateControls();
  }

  reset() {
    this.remaining = this.duration;
    this.status = 'IDLE';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateDisplay();
    this.updateControls();
    this.container.classList.remove('timer-completed');
  }

  tick() {
    if (this.status !== 'RUNNING') return;
    
    this.remaining--;
    this.updateDisplay();
    
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.status = 'COMPLETED';
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.onComplete();
    }
  }

  onComplete() {
    this.container.classList.add('timer-completed');
    this.updateControls();
    
    // Trigger completion callbacks
    this.completionCallbacks.forEach(callback => callback());
    
    // Show completion notification
    this.showCompletionNotification();
  }

  showCompletionNotification() {
    // Simple notification - can be enhanced with more sophisticated UI
    alert('Focus session completed! Time for a break.');
  }

  addCompletionCallback(callback) {
    this.completionCallbacks.push(callback);
  }

  getRemainingTime() {
    return this.remaining;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  updateDisplay() {
    const displayElement = this.container.querySelector('.timer-display');
    if (displayElement) {
      displayElement.textContent = this.formatTime(this.remaining);
    }
  }

  updateControls() {
    const startBtn = this.container.querySelector('.timer-start');
    const stopBtn = this.container.querySelector('.timer-stop');
    const resetBtn = this.container.querySelector('.timer-reset');

    if (startBtn) {
      startBtn.disabled = this.status === 'RUNNING' || this.status === 'COMPLETED';
      startBtn.textContent = this.status === 'PAUSED' ? 'Resume' : 'Start';
    }
    
    if (stopBtn) {
      stopBtn.disabled = this.status !== 'RUNNING';
    }
    
    if (resetBtn) {
      resetBtn.disabled = false;
    }
  }

  attachEventListeners() {
    const startBtn = this.container.querySelector('.timer-start');
    const stopBtn = this.container.querySelector('.timer-stop');
    const resetBtn = this.container.querySelector('.timer-reset');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }
    
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  }

  render() {
    this.container.innerHTML = `
      <h2>Focus Timer</h2>
      <div class="timer-display">${this.formatTime(this.remaining)}</div>
      <div class="timer-controls">
        <button class="btn btn-success timer-start">Start</button>
        <button class="btn btn-secondary timer-stop" disabled>Stop</button>
        <button class="btn btn-primary timer-reset">Reset</button>
      </div>
    `;
    this.attachEventListeners();
  }
}

/**
 * Task Manager Component - Handles CRUD operations for tasks
 */
class TaskManager {
  constructor(containerElement, storageProvider) {
    this.container = containerElement;
    this.storage = storageProvider;
    this.tasks = [];
    this.init();
  }

  init() {
    this.loadTasks();
    this.render();
    this.attachEventListeners();
  }

  loadTasks() {
    const savedTasks = this.storage.load(APP_CONFIG.STORAGE_KEYS.TASKS);
    if (savedTasks && Array.isArray(savedTasks)) {
      this.tasks = savedTasks.map(taskData => this.createTaskFromData(taskData));
    }
  }

  saveTasks() {
    const taskData = this.tasks.map(task => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : null
    }));
    
    this.storage.save(APP_CONFIG.STORAGE_KEYS.TASKS, taskData);
  }

  createTaskFromData(data) {
    return {
      id: data.id,
      text: data.text,
      completed: data.completed,
      createdAt: new Date(data.createdAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : null
    };
  }

  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addTask(text) {
    if (!text || text.trim() === '') {
      return false;
    }

    const task = {
      id: this.generateTaskId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      completedAt: null
    };

    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    return true;
  }

  editTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if (task && newText && newText.trim() !== '') {
      task.text = newText.trim();
      this.saveTasks();
      this.renderTasks();
      return true;
    }
    return false;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date() : null;
      this.saveTasks();
      this.renderTasks();
      return true;
    }
    return false;
  }

  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.saveTasks();
      this.renderTasks();
      return true;
    }
    return false;
  }

  getTasks() {
    return [...this.tasks];
  }

  attachEventListeners() {
    const form = this.container.querySelector('.task-input-form');
    const input = this.container.querySelector('.task-input');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input) {
          this.addTask(input.value);
          input.value = '';
        }
      });
    }
  }

  renderTasks() {
    const taskList = this.container.querySelector('.task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    this.tasks.forEach(task => {
      const taskItem = document.createElement('li');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
               data-task-id="${task.id}">
        <input type="text" class="task-text" value="${task.text}" 
               data-task-id="${task.id}" readonly>
        <button class="btn btn-danger btn-small task-delete" data-task-id="${task.id}">Delete</button>
      `;

      // Add event listeners for this task item
      const checkbox = taskItem.querySelector('.task-checkbox');
      const textInput = taskItem.querySelector('.task-text');
      const deleteBtn = taskItem.querySelector('.task-delete');

      if (checkbox) {
        checkbox.addEventListener('change', () => this.toggleComplete(task.id));
      }

      if (textInput) {
        textInput.addEventListener('click', () => {
          textInput.readOnly = false;
          textInput.focus();
          textInput.select();
        });

        textInput.addEventListener('blur', () => {
          textInput.readOnly = true;
          this.editTask(task.id, textInput.value);
        });

        textInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            textInput.blur();
          }
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTask(task.id);
          }
        });
      }

      taskList.appendChild(taskItem);
    });
  }

  render() {
    this.container.innerHTML = `
      <h2>Tasks</h2>
      <form class="task-input-form">
        <input type="text" class="task-input" placeholder="Add a new task..." required>
        <button type="submit" class="btn btn-primary">Add Task</button>
      </form>
      <ul class="task-list"></ul>
    `;
    
    this.attachEventListeners();
    this.renderTasks();
  }
}

/**
 * Quick Links Component - Manages website shortcuts
 */
class QuickLinks {
  constructor(containerElement, storageProvider) {
    this.container = containerElement;
    this.storage = storageProvider;
    this.links = [];
    this.init();
  }

  init() {
    this.loadLinks();
    this.render();
    this.attachEventListeners();
  }

  loadLinks() {
    const savedLinks = this.storage.load(APP_CONFIG.STORAGE_KEYS.LINKS);
    if (savedLinks && Array.isArray(savedLinks)) {
      this.links = savedLinks.map(linkData => this.createLinkFromData(linkData));
    }
  }

  saveLinks() {
    const linkData = this.links.map(link => ({
      id: link.id,
      name: link.name,
      url: link.url,
      createdAt: link.createdAt.toISOString()
    }));
    
    this.storage.save(APP_CONFIG.STORAGE_KEYS.LINKS, linkData);
  }

  createLinkFromData(data) {
    return {
      id: data.id,
      name: data.name,
      url: data.url,
      createdAt: new Date(data.createdAt)
    };
  }

  generateLinkId() {
    return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  }

  validateUrl(url) {
    try {
      new URL(this.normalizeUrl(url));
      return true;
    } catch {
      return false;
    }
  }

  addLink(name, url) {
    if (!name || name.trim() === '' || !url || url.trim() === '') {
      return false;
    }

    const normalizedUrl = this.normalizeUrl(url.trim());
    if (!this.validateUrl(normalizedUrl)) {
      return false;
    }

    const link = {
      id: this.generateLinkId(),
      name: name.trim(),
      url: normalizedUrl,
      createdAt: new Date()
    };

    this.links.push(link);
    this.saveLinks();
    this.renderLinks();
    return true;
  }

  deleteLink(id) {
    const index = this.links.findIndex(l => l.id === id);
    if (index !== -1) {
      this.links.splice(index, 1);
      this.saveLinks();
      this.renderLinks();
      return true;
    }
    return false;
  }

  openLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getLinks() {
    return [...this.links];
  }

  attachEventListeners() {
    const form = this.container.querySelector('.link-input-form');
    const nameInput = this.container.querySelector('.link-name-input');
    const urlInput = this.container.querySelector('.link-url-input');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (nameInput && urlInput) {
          const success = this.addLink(nameInput.value, urlInput.value);
          if (success) {
            nameInput.value = '';
            urlInput.value = '';
          } else {
            alert('Please enter a valid name and URL');
          }
        }
      });
    }
  }

  renderLinks() {
    const linksGrid = this.container.querySelector('.links-grid');
    if (!linksGrid) return;

    linksGrid.innerHTML = '';

    this.links.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      linkItem.innerHTML = `
        <button class="link-button" data-url="${link.url}">${link.name}</button>
        <button class="btn btn-danger btn-small link-delete" data-link-id="${link.id}">×</button>
      `;

      // Add event listeners for this link item
      const linkButton = linkItem.querySelector('.link-button');
      const deleteBtn = linkItem.querySelector('.link-delete');

      if (linkButton) {
        linkButton.addEventListener('click', () => this.openLink(link.url));
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Are you sure you want to delete "${link.name}"?`)) {
            this.deleteLink(link.id);
          }
        });
      }

      linksGrid.appendChild(linkItem);
    });
  }

  render() {
    this.container.innerHTML = `
      <h2>Quick Links</h2>
      <form class="link-input-form">
        <div class="link-input-row">
          <input type="text" class="link-name-input" placeholder="Link name..." required>
          <input type="text" class="link-url-input" placeholder="URL..." required>
        </div>
        <button type="submit" class="btn btn-primary">Add Link</button>
      </form>
      <div class="links-grid"></div>
    `;
    
    this.attachEventListeners();
    this.renderLinks();
  }
}

/**
 * Main Application Class - Coordinates all components
 */
class TodoDashboardApp {
  constructor() {
    this.storage = new StorageProvider();
    this.components = {};
    this.init();
  }

  init() {
    // Check if storage is available and show warning if not
    if (!this.storage.isAvailable()) {
      this.showStorageWarning();
    }

    // Initialize components
    this.initializeComponents();
    
    // Set up error handling
    this.setupErrorHandling();
  }

  showStorageWarning() {
    const warning = document.createElement('div');
    warning.className = 'error-message';
    warning.textContent = 'Local Storage is not available. Your data will not be saved between sessions.';
    document.body.insertBefore(warning, document.body.firstChild);
  }

  initializeComponents() {
    // Initialize Time Display
    const timeContainer = document.querySelector('.time-display');
    if (timeContainer) {
      this.components.timeDisplay = new TimeDisplay(timeContainer);
    }

    // Initialize Focus Timer
    const timerContainer = document.querySelector('.focus-timer');
    if (timerContainer) {
      this.components.focusTimer = new FocusTimer(timerContainer);
    }

    // Initialize Task Manager
    const taskContainer = document.querySelector('.task-manager');
    if (taskContainer) {
      this.components.taskManager = new TaskManager(taskContainer, this.storage);
    }

    // Initialize Quick Links
    const linksContainer = document.querySelector('.quick-links');
    if (linksContainer) {
      this.components.quickLinks = new QuickLinks(linksContainer, this.storage);
    }
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Application error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }

  // Cleanup method for when the app is destroyed
  destroy() {
    if (this.components.timeDisplay) {
      this.components.timeDisplay.stop();
    }
    
    if (this.components.focusTimer) {
      this.components.focusTimer.reset();
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.todoApp = new TodoDashboardApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.todoApp) {
    window.todoApp.destroy();
  }
});