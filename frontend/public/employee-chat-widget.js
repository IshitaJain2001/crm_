/**
 * CRM Employee Chat Widget
 * For employees to chat with admin about common questions
 */

(function() {
  const EmployeeChat = window.EmployeeChat || {};

  EmployeeChat.init = function(config) {
    const settings = {
      apiUrl: config.apiUrl || 'http://localhost:5000/api',
      position: config.position || 'bottom-right',
      ...config
    };

    const createWidget = () => {
      const widgetHTML = `
        <div id="employee-chat-widget" class="employee-chat-widget employee-chat-${settings.position}">
          <div class="employee-chat-button" title="Chat with Admin">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="employee-chat-window">
            <div class="employee-chat-header">
              <h3>Chat with Admin</h3>
              <button class="employee-chat-close">×</button>
            </div>
            <div class="employee-chat-content">
              <div class="employee-chat-faq">
                <h4>Frequently Asked Questions</h4>
                <div class="employee-chat-questions"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      const styles = `
        <style>
          .employee-chat-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            position: fixed;
            z-index: 9999;
            bottom: 20px;
            right: 20px;
          }

          .employee-chat-widget.employee-chat-bottom-left {
            left: 20px;
            right: auto;
          }

          .employee-chat-widget.employee-chat-top-right {
            bottom: auto;
            top: 20px;
          }

          .employee-chat-widget.employee-chat-top-left {
            bottom: auto;
            top: 20px;
            left: 20px;
            right: auto;
          }

          .employee-chat-button {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
          }

          .employee-chat-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }

          .employee-chat-window {
            display: none;
            width: 380px;
            max-height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
            position: absolute;
            bottom: 80px;
            right: 0;
            flex-direction: column;
            animation: slideUp 0.3s ease;
            overflow: hidden;
          }

          .employee-chat-window.active {
            display: flex;
          }

          .employee-chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .employee-chat-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }

          .employee-chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
          }

          .employee-chat-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
          }

          .employee-chat-faq h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
          }

          .employee-chat-questions {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .employee-chat-question {
            padding: 12px;
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            color: #374151;
          }

          .employee-chat-question:hover {
            background: #e5e7eb;
            border-color: #d1d5db;
          }

          .employee-chat-question::before {
            content: "❓ ";
          }

          .employee-chat-answer {
            margin-top: 12px;
            padding: 12px;
            background: #dbeafe;
            border-left: 4px solid #667eea;
            border-radius: 4px;
            font-size: 14px;
            color: #1e40af;
            line-height: 1.5;
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

          @media (max-width: 480px) {
            .employee-chat-window {
              width: 100%;
              max-width: 100%;
              bottom: 0;
              right: 0;
              border-radius: 0;
            }
          }
        </style>
      `;

      document.head.insertAdjacentHTML('beforeend', styles);
      document.body.insertAdjacentHTML('beforeend', widgetHTML);

      const widget = document.getElementById('employee-chat-widget');
      const button = widget.querySelector('.employee-chat-button');
      const chatWindow = widget.querySelector('.employee-chat-window');
      const closeBtn = widget.querySelector('.employee-chat-close');
      const questionsDiv = widget.querySelector('.employee-chat-questions');

      let isOpen = false;

      // Default questions
      const defaultQuestions = [
        { q: 'How do I reset my password?', a: 'Go to Login > Forgot Password and follow the instructions sent to your email.' },
        { q: 'What are office hours?', a: 'Office hours are 9 AM to 6 PM, Monday to Friday. Contact HR for details.' },
        { q: 'How to submit leave request?', a: 'Go to HR module > Leave Management > Submit Request with dates and reason.' },
        { q: 'Where is HR office located?', a: 'HR office is on 2nd floor, Building A. Visit during office hours.' }
      ];

      // Load questions
      function loadQuestions() {
        questionsDiv.innerHTML = '';
        defaultQuestions.forEach((item, idx) => {
          const qBtn = document.createElement('div');
          qBtn.className = 'employee-chat-question';
          qBtn.textContent = item.q;
          qBtn.onclick = (e) => {
            e.stopPropagation();
            // Show answer
            let answerDiv = qBtn.nextElementSibling;
            if (answerDiv && answerDiv.classList.contains('employee-chat-answer')) {
              answerDiv.remove();
            } else {
              const newAnswer = document.createElement('div');
              newAnswer.className = 'employee-chat-answer';
              newAnswer.textContent = '✅ ' + item.a;
              qBtn.parentNode.insertBefore(newAnswer, qBtn.nextSibling);
            }
          };
          questionsDiv.appendChild(qBtn);
        });
      }

      loadQuestions();

      button.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('active');
      });

      closeBtn.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('active');
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createWidget);
    } else {
      createWidget();
    }
  };

  window.EmployeeChat = EmployeeChat;
})();
