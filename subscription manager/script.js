 document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      htmlEl.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      
      showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'info');
    });
    
    function updateThemeIcon(theme) {
      themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Elements
    const form = document.getElementById('subscription-form');
    const subscriptionList = document.getElementById('subscription-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const sortBy = document.getElementById('sort-by');
    const cardViewBtn = document.getElementById('card-view-btn');
    const calendarViewBtn = document.getElementById('calendar-view-btn');
    const cardView = document.getElementById('subscription-list');
    const calendarView = document.getElementById('calendar-view');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    // Modal elements
    const confirmModal = document.getElementById('confirm-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    // Dashboard elements
    const totalMonthlyEl = document.getElementById('total-monthly');
    const totalYearlyEl = document.getElementById('total-yearly');
    const totalSubscriptionsEl = document.getElementById('total-subscriptions');
    const dueSoonEl = document.getElementById('due-soon');
    
    // Retrieve saved subscriptions from localStorage or initialize empty array
    let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];
    let filteredSubscriptions = [...subscriptions];
    
    // Calendar view variables
    let currentCalendarDate = new Date();
    
    // Service icons mapping
    const serviceIcons = {
      'netflix': 'fa-play',
      'spotify': 'fa-music',
      'amazon': 'fa-shopping-cart',
      'youtube': 'fa-youtube',
      'apple': 'fa-apple',
      'disney': 'fa-film',
      'microsoft': 'fa-windows',
      'adobe': 'fa-paint-brush',
      'dropbox': 'fa-dropbox',
      'google': 'fa-google',
      'github': 'fa-github',
      'default': 'fa-credit-card'
    };
    
    // Category icons mapping
    const categoryIcons = {
      'streaming': 'fa-film',
      'software': 'fa-laptop-code',
      'gaming': 'fa-gamepad',
      'music': 'fa-music',
      'news': 'fa-newspaper',
      'storage': 'fa-database',
      'other': 'fa-tag'
    };
    
    // Save subscriptions to localStorage
    function saveSubscriptions() {
      localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      let icon = 'fa-info-circle';
      if (type === 'success') icon = 'fa-check-circle';
      if (type === 'error') icon = 'fa-exclamation-circle';
      
      toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
      `;
      
      const container = document.getElementById('toast-container');
      container.appendChild(toast);
      
      // Remove the toast after animation completes
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
    
    // Show confirmation modal
    function showConfirmModal(message, callback) {
      modalMessage.textContent = message;
      confirmModal.classList.add('active');
      
      // Store the callback for later
      modalConfirm.onclick = function() {
        confirmModal.classList.remove('active');
        callback();
      };
      
      modalCancel.onclick = function() {
        confirmModal.classList.remove('active');
      };
    }
    
    // Get appropriate icon for a service
    function getServiceIcon(serviceName) {
      serviceName = serviceName.toLowerCase();
      for (const [key, icon] of Object.entries(serviceIcons)) {
        if (serviceName.includes(key)) {
          return icon;
        }
      }
      return serviceIcons.default;
    }
    
    // Format currency
    function formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    }
    
    // Calculate days until due date
    function getDaysUntil(dateString) {
      const dueDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate the difference in milliseconds
      const diffTime = dueDate.getTime() - today.getTime();
      
      // Convert to days
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Format date for display
    function formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Get due date status message
    function getDueDateMessage(days) {
      if (days < 0) return `Overdue by ${Math.abs(days)} days`;
      if (days === 0) return 'Due today';
      if (days === 1) return 'Due tomorrow';
      return `Due in ${days} days`;
    }
    
    // Calculate progress percentage for due date
    function getDueDateProgress(subscription) {
      const { frequency, dueDate } = subscription;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dueDateObj = new Date(dueDate);
      
      let cycleDays;
      let previousDueDate;
      
      switch(frequency) {
        case 'weekly':
          cycleDays = 7;
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setDate(dueDateObj.getDate() - 7);
          break;
        case 'bi-weekly':
          cycleDays = 14;
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setDate(dueDateObj.getDate() - 14);
          break;
        case 'monthly':
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setMonth(dueDateObj.getMonth() - 1);
          cycleDays = (dueDateObj - previousDueDate) / (1000 * 60 * 60 * 24);
          break;
        case 'quarterly':
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setMonth(dueDateObj.getMonth() - 3);
          cycleDays = (dueDateObj - previousDueDate) / (1000 * 60 * 60 * 24);
          break;
        case 'yearly':
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setFullYear(dueDateObj.getFullYear() - 1);
          cycleDays = (dueDateObj - previousDueDate) / (1000 * 60 * 60 * 24);
          break;
        default:
          cycleDays = 30; // Default to monthly
          previousDueDate = new Date(dueDateObj);
          previousDueDate.setMonth(dueDateObj.getMonth() - 1);
      }
      
      // Calculate elapsed time since the previous due date
      const elapsedDays = (today - previousDueDate) / (1000 * 60 * 60 * 24);
      
      // Calculate the percentage
      let percentage = (elapsedDays / cycleDays) * 100;
      
      // Ensure percentage is between 0 and 100
      percentage = Math.max(0, Math.min(100, percentage));
      
      return percentage;
    }
    
    // Update dashboard statistics
    function updateDashboard() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate monthly spending (only include active subscriptions)
      const monthlyTotal = subscriptions.reduce((total, sub) => {
        if (sub.status !== 'cancelled') {
          const amount = parseFloat(sub.amount);
          if (sub.frequency === 'monthly') return total + amount;
          if (sub.frequency === 'yearly') return total + (amount / 12);
          if (sub.frequency === 'weekly') return total + (amount * 4.33);
          if (sub.frequency === 'bi-weekly') return total + (amount * 2.17);
          if (sub.frequency === 'quarterly') return total + (amount / 3);
        }
        return total;
      }, 0);
      
      // Calculate yearly spending
      const yearlyTotal = monthlyTotal * 12;
      
      // Count active subscriptions
      const activeCount = subscriptions.filter(sub => sub.status !== 'cancelled').length;
      
      // Count subscriptions due in the next 7 days
      const dueSoonCount = subscriptions.filter(sub => {
        if (sub.status === 'cancelled') return false;
        const daysUntil = getDaysUntil(sub.dueDate);
        return daysUntil >= 0 && daysUntil <= 7;
      }).length;
      
      // Update UI
      totalMonthlyEl.textContent = formatCurrency(monthlyTotal);
      totalYearlyEl.textContent = formatCurrency(yearlyTotal);
      totalSubscriptionsEl.textContent = activeCount;
      dueSoonEl.textContent = dueSoonCount;
    }
    
    // Create and return a subscription card element
    function createSubscriptionCard(subscription, index) {
      const card = document.createElement('div');
      card.className = `subscription-card ${subscription.status}`;
      
      // Calculate days until due date
      const daysUntil = getDaysUntil(subscription.dueDate);
      if (daysUntil >= 0 && daysUntil <= 3 && subscription.status === 'pending') {
        card.classList.add('due-soon');
      }
      
      // Get appropriate icon
      const serviceIcon = getServiceIcon(subscription.serviceName);
      const categoryIcon = subscription.category ? categoryIcons[subscription.category] : categoryIcons.other;
      
      // Calculate due date progress
      const progressPercentage = getDueDateProgress(subscription);
      const isUrgent = daysUntil <= 3 && daysUntil >= 0;
      
      card.innerHTML = `
        <div class="service-header">
          <div class="service-icon">
            <i class="fas ${serviceIcon}"></i>
          </div>
          <div class="service-name">${subscription.serviceName}</div>
        </div>
        
        <div class="subscription-details">
          <div class="subscription-detail">
            <i class="detail-icon fas fa-dollar-sign"></i>
            ${formatCurrency(subscription.amount)} per ${subscription.frequency}
          </div>
          
          <div class="subscription-detail">
            <i class="detail-icon fas fa-calendar-day"></i>
            ${formatDate(subscription.dueDate)} (${getDueDateMessage(daysUntil)})
          </div>
          
          <div class="subscription-detail">
            <i class="detail-icon fas ${categoryIcon}"></i>
            ${subscription.category ? subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1) : 'Other'}
          </div>
          
          ${subscription.description ? `
            <div class="subscription-detail">
              <i class="detail-icon fas fa-sticky-note"></i>
              ${subscription.description}
            </div>
          ` : ''}
        </div>
        
        <div class="due-date-progress">
          <div class="progress-bar ${isUrgent ? 'urgent' : ''}" style="width: ${progressPercentage}%"></div>
        </div>
        
        <div class="subscription-actions">
          ${subscription.status === 'pending' ? `
            <button class="pay-btn" data-index="${index}">
              <i class="fas fa-check"></i> Mark Paid
            </button>
          ` : ''}
          <button class="edit-btn" data-index="${index}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="delete-btn" data-index="${index}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      `;
      
      card.style.animation = "fadeIn 0.5s ease-in-out";
      return card;
    }
    
    // Apply filters and sorting to subscriptions
    function applyFilters() {
      const searchTerm = searchInput.value.toLowerCase();
      const categoryValue = categoryFilter.value;
      const statusValue = statusFilter.value;
      const sortValue = sortBy.value;
      
      filteredSubscriptions = subscriptions.filter(sub => {
        // Apply search filter
        const matchesSearch = searchTerm === '' || 
                             sub.serviceName.toLowerCase().includes(searchTerm) || 
                             (sub.description && sub.description.toLowerCase().includes(searchTerm));
        
        // Apply category filter
        const matchesCategory = categoryValue === '' || sub.category === categoryValue;
        
        // Apply status filter
        const matchesStatus = statusValue === '' || sub.status === statusValue;
        
        return matchesSearch && matchesCategory && matchesStatus;
      });
      
      // Apply sorting
      filteredSubscriptions.sort((a, b) => {
        switch(sortValue) {
          case 'amount':
            return parseFloat(b.amount) - parseFloat(a.amount);
          case 'dueDate':
            return new Date(a.dueDate) - new Date(b.dueDate);
          case 'name':
            return a.serviceName.localeCompare(b.serviceName);
          default:
            return 0;
        }
      });
      
      renderSubscriptions();
    }
    
    // Render subscriptions to the list element
    function renderSubscriptions() {
      subscriptionList.innerHTML = "";
      
      if (filteredSubscriptions.length === 0) {
        const noSubscriptions = document.createElement('div');
        noSubscriptions.className = 'no-subscriptions';
        noSubscriptions.innerHTML = `
          <i class="fas fa-clipboard-list"></i>
          <p>No subscriptions found. Add your first subscription above!</p>
        `;
        subscriptionList.appendChild(noSubscriptions);
        return;
      }
      
      filteredSubscriptions.forEach((subscription, index) => {
        const actualIndex = subscriptions.findIndex(s => 
          s.serviceName === subscription.serviceName && 
          s.amount === subscription.amount && 
          s.dueDate === subscription.dueDate
        );
        
        const card = createSubscriptionCard(subscription, actualIndex);
        subscriptionList.appendChild(card);
      });
    }
    
    // Toggle between card and calendar views
    cardViewBtn.addEventListener('click', () => {
      cardView.style.display = 'grid';
      calendarView.style.display = 'none';
      cardViewBtn.classList.add('active');
      calendarViewBtn.classList.remove('active');
    });
    
    calendarViewBtn.addEventListener('click', () => {
      cardView.style.display = 'none';
      calendarView.style.display = 'block';
      cardViewBtn.classList.remove('active');
      calendarViewBtn.classList.add('active');
      renderCalendar();
    });
    
    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      renderCalendar();
    });
    
    // Event listener to handle new subscription entry
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const subscription = {
        serviceName: form.serviceName.value.trim(),
        amount: form.amount.value,
        dueDate: form.dueDate.value,
        frequency: form.frequency.value,
        status: form.status.value,
        category: form.category.value,
        description: form.description.value.trim()
      };
      
      subscriptions.push(subscription);
      saveSubscriptions();
      updateDashboard();
      applyFilters();
      form.reset();
      
      showToast(`${subscription.serviceName} subscription added successfully!`, 'success');
    });
    
    // Subscription list event listener for button actions
    subscriptionList.addEventListener('click', (e) => {
      // Delete button clicked
      if (e.target.closest('.delete-btn')) {
        const index = e.target.closest('.delete-btn').getAttribute('data-index');
        const subscriptionName = subscriptions[index].serviceName;
        
        showConfirmModal(`Are you sure you want to delete ${subscriptionName}?`, () => {
          subscriptions.splice(index, 1);
          saveSubscriptions();
          updateDashboard();
          applyFilters();
          showToast(`${subscriptionName} subscription deleted`, 'info');
        });
      }
      
      // Mark as paid button clicked
      if (e.target.closest('.pay-btn')) {
        const index = e.target.closest('.pay-btn').getAttribute('data-index');
        subscriptions[index].status = 'paid';
        saveSubscriptions();
        applyFilters();
        showToast(`${subscriptions[index].serviceName} marked as paid`, 'success');
      }
      
      // Edit button clicked
      if (e.target.closest('.edit-btn')) {
        const index = e.target.closest('.edit-btn').getAttribute('data-index');
        const subscription = subscriptions[index];
        
        // Fill the form with subscription data
        form.serviceName.value = subscription.serviceName;
        form.amount.value = subscription.amount;
        form.dueDate.value = subscription.dueDate;
        form.frequency.value = subscription.frequency;
        form.status.value = subscription.status;
        form.category.value = subscription.category || '';
        form.description.value = subscription.description || '';
        
        // Remove the subscription and scroll to form
        subscriptions.splice(index, 1);
        saveSubscriptions();
        applyFilters();
        form.scrollIntoView({ behavior: 'smooth' });
        showToast(`Editing ${subscription.serviceName} subscription`, 'info');
      }
    });
    
    // Filter change event listeners
    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
    
    // Initial setup
    updateDashboard();
    applyFilters();
  });