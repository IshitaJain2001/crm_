/**
 * CRM Live Chatbot Widget
 * Embed this script on any website to enable live chat
 */

(function() {
  const CRMChatbot = window.CRMChatbot || {};

  CRMChatbot.init = function(config) {
    // Default configuration
    const settings = {
      chatbotId: config.chatbotId,
      theme: config.theme || 'light',
      position: config.position || 'bottom-right',
      headerText: config.headerText || 'Chat with us',
      apiUrl: config.apiUrl || 'http://localhost:5000/api',
      ...config
    };

    // Generate unique visitor ID
    const getVisitorId = () => {
      let visitorId = localStorage.getItem('crm_visitor_id');
      if (!visitorId) {
        visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        localStorage.setItem('crm_visitor_id', visitorId);
      }
      return visitorId;
    };

    // Create widget HTML
    const createWidget = () => {
      const widgetHTML = `
        <div id="crm-chatbot-widget" class="crm-chatbot-widget crm-chatbot-${settings.theme}">
          <div class="crm-chatbot-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="crm-chatbot-window">
            <div class="crm-chatbot-header">
              <h3>${settings.headerText}</h3>
              <button class="crm-chatbot-close">×</button>
            </div>
            <div class="crm-chatbot-messages">
              <div class="crm-chatbot-loading">Connecting...</div>
            </div>
            <div class="crm-chatbot-input">
              <input type="text" placeholder="Type your message..." class="crm-chatbot-input-field">
              <button class="crm-chatbot-send">Send</button>
            </div>
          </div>
        </div>
      `;

      // Add styles
      const styles = `
        <style>
          .crm-chatbot-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            position: fixed;
            z-index: 9999;
            bottom: 20px;
            right: 20px;
          }

          .crm-chatbot-widget.crm-chatbot-bottom-left {
            left: 20px;
            right: auto;
          }

          .crm-chatbot-widget.crm-chatbot-top-right {
            bottom: auto;
            top: 20px;
          }

          .crm-chatbot-widget.crm-chatbot-top-left {
            bottom: auto;
            top: 20px;
            left: 20px;
            right: auto;
          }

          .crm-chatbot-button {
            width: 56px;
            height: 56px;
            background: #3b82f6;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          }

          .crm-chatbot-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }

          .crm-chatbot-window {
            display: none;
            width: 380px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
            position: absolute;
            bottom: 80px;
            right: 0;
            flex-direction: column;
            animation: slideUp 0.3s ease;
          }

          .crm-chatbot-widget.crm-chatbot-bottom-left .crm-chatbot-window {
            right: auto;
            left: 0;
          }

          .crm-chatbot-widget.crm-chatbot-top-right .crm-chatbot-window {
            bottom: auto;
            top: 80px;
          }

          .crm-chatbot-widget.crm-chatbot-top-left .crm-chatbot-window {
            bottom: auto;
            top: 80px;
            right: auto;
            left: 0;
          }

          .crm-chatbot-window.active {
            display: flex;
          }

          .crm-chatbot-dark .crm-chatbot-window {
            background: #1f2937;
            color: white;
          }

          .crm-chatbot-header {
            background: #3b82f6;
            color: white;
            padding: 16px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .crm-chatbot-dark .crm-chatbot-header {
            background: #1e40af;
          }

          .crm-chatbot-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }

          .crm-chatbot-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
          }

          .crm-chatbot-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .crm-chatbot-dark .crm-chatbot-messages {
            background: #111827;
          }

          .crm-chatbot-message {
            display: flex;
            animation: fadeIn 0.3s ease;
          }

          .crm-chatbot-message.bot {
            justify-content: flex-start;
          }

          .crm-chatbot-message.visitor {
            justify-content: flex-end;
          }

          .crm-chatbot-message-content {
            max-width: 70%;
            padding: 8px 12px;
            border-radius: 8px;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.4;
          }

          .crm-chatbot-message.bot .crm-chatbot-message-content {
            background: #f3f4f6;
            color: #1f2937;
          }

          .crm-chatbot-dark .crm-chatbot-message.bot .crm-chatbot-message-content {
            background: #374151;
            color: #f3f4f6;
          }

          .crm-chatbot-message.visitor .crm-chatbot-message-content {
            background: #3b82f6;
            color: white;
          }

          .crm-chatbot-loading {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            padding: 20px;
          }

          .crm-chatbot-input {
            display: flex;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid #e5e7eb;
          }

          .crm-chatbot-dark .crm-chatbot-input {
            border-top-color: #374151;
          }

          .crm-chatbot-input-field {
            flex: 1;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            font-family: inherit;
          }

          .crm-chatbot-dark .crm-chatbot-input-field {
            background: #374151;
            border-color: #4b5563;
            color: white;
          }

          .crm-chatbot-input-field:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .crm-chatbot-send {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
          }

          .crm-chatbot-send:hover {
            background: #2563eb;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @media (max-width: 480px) {
            .crm-chatbot-window {
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              border-radius: 0;
              bottom: 0;
              right: 0;
            }

            .crm-chatbot-widget.crm-chatbot-bottom-left .crm-chatbot-window,
            .crm-chatbot-widget.crm-chatbot-top-right .crm-chatbot-window,
            .crm-chatbot-widget.crm-chatbot-top-left .crm-chatbot-window {
              width: 100%;
              height: 100%;
              bottom: 0;
              right: 0;
              top: auto;
              left: auto;
            }
          }
        </style>
      `;

      document.head.insertAdjacentHTML('beforeend', styles);
      document.body.insertAdjacentHTML('beforeend', widgetHTML);

      // Get elements
      const widget = document.getElementById('crm-chatbot-widget');
      const button = widget.querySelector('.crm-chatbot-button');
      const chatWindow = widget.querySelector('.crm-chatbot-window');
      const closeBtn = widget.querySelector('.crm-chatbot-close');
      const messagesDiv = widget.querySelector('.crm-chatbot-messages');
      const inputField = widget.querySelector('.crm-chatbot-input-field');
      const sendBtn = widget.querySelector('.crm-chatbot-send');

      // Set position class
      widget.classList.add(`crm-chatbot-${settings.position}`);

      // State
      let conversationId = null;
      let isOpen = false;

      // Toggle chat
      button.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active');
        if (isOpen && !conversationId) {
          startConversation();
        }
      });

      closeBtn.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('active');
      });

      // Send message
      const sendMessage = () => {
        const message = inputField.value.trim();
        if (!message || !conversationId) return;

        // Add visitor message
        addMessage(message, 'visitor');
        inputField.value = '';

        // Send to API
        fetch(`${settings.apiUrl}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            sender: 'visitor',
            content: message
          })
        })
        .catch(err => console.error('Error sending message:', err));
      };

      sendBtn.addEventListener('click', sendMessage);
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });

      // Start conversation
      function startConversation() {
        const visitorId = getVisitorId();

        fetch(`${settings.apiUrl}/conversations/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatbotId: settings.chatbotId,
            visitorId,
            visitorEmail: '',
            visitorName: '',
            metadata: {
              source: 'website',
              sourceUrl: window.location.href,
              userAgent: navigator.userAgent
            }
          })
        })
        .then(res => res.json())
        .then(data => {
          conversationId = data.conversationId;
          messagesDiv.innerHTML = '';
          
          if (data.welcomeMessage) {
            addMessage(data.welcomeMessage, 'bot');
          }
          
          inputField.focus();
        })
        .catch(err => {
          console.error('Error starting conversation:', err);
          addMessage('Sorry, unable to connect. Please try again.', 'bot');
        });
      }

      // Add message to UI
      function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `crm-chatbot-message ${sender}`;
        messageDiv.innerHTML = `<div class="crm-chatbot-message-content">${escapeHtml(content)}</div>`;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }

      // Escape HTML
      function escapeHtml(text) {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
      }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createWidget);
    } else {
      createWidget();
    }
  };

  window.CRMChatbot = CRMChatbot;
})();
