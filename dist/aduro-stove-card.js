class AduroStoveCard extends HTMLElement {
  set hass(hass) {
    if (!this._initialized) {
      this._initialize();
    }
    
    this._hass = hass;
    this._updateContent();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this._config = config;
  }

  _initialize() {
    this._initialized = true;
    
    const card = document.createElement('ha-card');
    card.innerHTML = `
      <style>
        .card-content {
          padding: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--divider-color);
        }
        .header-title {
          font-size: 24px;
          font-weight: 500;
        }
        .status-icons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .status-icon {
          width: 24px;
          height: 24px;
          color: var(--primary-color);
        }
        .hidden {
          display: none;
        }
        .pellet-level {
          margin-bottom: 16px;
        }
        .pellet-bar {
          height: 24px;
          background: var(--divider-color);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .pellet-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 12px;
        }
        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .control-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .control-label {
          font-size: 14px;
          color: var(--secondary-text-color);
          font-weight: 500;
        }
        .control-input {
          padding: 8px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .toggle-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .toggle-button.on {
          background: var(--primary-color);
          color: white;
        }
        .toggle-button.off {
          background: var(--divider-color);
          color: var(--secondary-text-color);
        }
        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
        }
        .action-button {
          padding: 12px;
          border: none;
          border-radius: 4px;
          background: var(--primary-color);
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .action-button:hover {
          opacity: 0.9;
        }
        .action-button:active {
          opacity: 0.7;
        }
      </style>
      <div class="card-content">
        <div class="header">
          <div class="header-title">Aduro Stove</div>
          <div class="status-icons">
            <ha-icon class="status-icon hidden" id="change-icon" icon="mdi:sync"></ha-icon>
          </div>
        </div>
        
        <div class="pellet-level">
          <div class="control-label">Pellet Level</div>
          <div class="pellet-bar">
            <div class="pellet-fill" id="pellet-fill">0%</div>
          </div>
        </div>

        <div class="controls-grid">
          <div class="control-item">
            <label class="control-label">Power</label>
            <button class="toggle-button" id="power-btn">OFF</button>
          </div>
          
          <div class="control-item">
            <label class="control-label">Display Format</label>
            <select class="control-input" id="display-format">
              <option value="celsius">Celsius</option>
              <option value="fahrenheit">Fahrenheit</option>
            </select>
          </div>
          
          <div class="control-item">
            <label class="control-label">Smoke Temperature</label>
            <input type="number" class="control-input" id="smoke-temp" min="0" max="300" step="1">
          </div>
          
          <div class="control-item">
            <label class="control-label">Heat Level</label>
            <input type="number" class="control-input" id="heat-level" min="1" max="5" step="1">
          </div>
          
          <div class="control-item">
            <label class="control-label">Target Temperature</label>
            <input type="number" class="control-input" id="target-temp" min="0" max="30" step="0.5">
          </div>
          
          <div class="control-item">
            <label class="control-label">Toggle Mode</label>
            <select class="control-input" id="toggle-mode">
              <option value="pellet">Pellet</option>
              <option value="wood">Wood</option>
            </select>
          </div>
          
          <div class="control-item">
            <label class="control-label">Auto Resume After Wood</label>
            <button class="toggle-button" id="auto-resume-btn">OFF</button>
          </div>
          
          <div class="control-item">
            <label class="control-label">Auto Shutdown Low Pellets</label>
            <button class="toggle-button" id="auto-shutdown-btn">OFF</button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="action-button" id="clean-btn">Clean Stove</button>
          <button class="action-button" id="refill-btn">Refill Pellets</button>
          <button class="action-button" id="reset-counter-btn">Reset Counter</button>
        </div>
      </div>
    `;
    
    this.appendChild(card);
    this._setupEventListeners();
  }

  _setupEventListeners() {
    // Power button
    this.querySelector('#power-btn').addEventListener('click', () => {
      this._callService('toggle', { entity_id: `${this._config.entity}.power` });
    });

    // Display format
    this.querySelector('#display-format').addEventListener('change', (e) => {
      this._callService('select_option', { 
        entity_id: `${this._config.entity}.display_format`,
        option: e.target.value 
      });
    });

    // Smoke temperature
    this.querySelector('#smoke-temp').addEventListener('change', (e) => {
      this._callService('set_value', { 
        entity_id: `${this._config.entity}.smoke_temperature`,
        value: e.target.value 
      });
    });

    // Heat level
    this.querySelector('#heat-level').addEventListener('change', (e) => {
      this._callService('set_value', { 
        entity_id: `${this._config.entity}.heat_level`,
        value: e.target.value 
      });
    });

    // Target temperature
    this.querySelector('#target-temp').addEventListener('change', (e) => {
      this._callService('set_value', { 
        entity_id: `${this._config.entity}.target_temperature`,
        value: e.target.value 
      });
    });

    // Toggle mode
    this.querySelector('#toggle-mode').addEventListener('change', (e) => {
      this._callService('select_option', { 
        entity_id: `${this._config.entity}.toggle_mode`,
        option: e.target.value 
      });
    });

    // Auto resume button
    this.querySelector('#auto-resume-btn').addEventListener('click', () => {
      this._callService('toggle', { entity_id: `${this._config.entity}.auto_resume` });
    });

    // Auto shutdown button
    this.querySelector('#auto-shutdown-btn').addEventListener('click', () => {
      this._callService('toggle', { entity_id: `${this._config.entity}.auto_shutdown` });
    });

    // Action buttons
    this.querySelector('#clean-btn').addEventListener('click', () => {
      this._callService('button.press', { entity_id: `${this._config.entity}.clean_stove` });
    });

    this.querySelector('#refill-btn').addEventListener('click', () => {
      this._callService('button.press', { entity_id: `${this._config.entity}.refill_pellets` });
    });

    this.querySelector('#reset-counter-btn').addEventListener('click', () => {
      this._callService('button.press', { entity_id: `${this._config.entity}.refill_counter` });
    });
  }

  _callService(service, data) {
    const [domain, serviceAction] = service.includes('.') ? service.split('.') : ['switch', service];
    this._hass.callService(domain, serviceAction, data);
  }

  _updateContent() {
    if (!this._hass || !this._config) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) return;

    // Update change in progress icon
    const changeIcon = this.querySelector('#change-icon');
    const changeInProgress = this._hass.states[`${this._config.entity}.change_in_progress`];
    if (changeInProgress && changeInProgress.state === 'on') {
      changeIcon.classList.remove('hidden');
    } else {
      changeIcon.classList.add('hidden');
    }

    // Update pellet percentage
    const pelletEntity = this._hass.states[`${this._config.entity}.pellet_percentage`];
    if (pelletEntity) {
      const percentage = parseInt(pelletEntity.state) || 0;
      const pelletFill = this.querySelector('#pellet-fill');
      pelletFill.style.width = `${percentage}%`;
      pelletFill.textContent = `${percentage}%`;
    }

    // Update power button
    const powerEntity = this._hass.states[`${this._config.entity}.power`];
    const powerBtn = this.querySelector('#power-btn');
    if (powerEntity && powerEntity.state === 'on') {
      powerBtn.classList.add('on');
      powerBtn.classList.remove('off');
      powerBtn.textContent = 'ON';
    } else {
      powerBtn.classList.add('off');
      powerBtn.classList.remove('on');
      powerBtn.textContent = 'OFF';
    }

    // Update auto resume button
    const autoResumeEntity = this._hass.states[`${this._config.entity}.auto_resume`];
    const autoResumeBtn = this.querySelector('#auto-resume-btn');
    if (autoResumeEntity && autoResumeEntity.state === 'on') {
      autoResumeBtn.classList.add('on');
      autoResumeBtn.classList.remove('off');
      autoResumeBtn.textContent = 'ON';
    } else {
      autoResumeBtn.classList.add('off');
      autoResumeBtn.classList.remove('on');
      autoResumeBtn.textContent = 'OFF';
    }

    // Update auto shutdown button
    const autoShutdownEntity = this._hass.states[`${this._config.entity}.auto_shutdown`];
    const autoShutdownBtn = this.querySelector('#auto-shutdown-btn');
    if (autoShutdownEntity && autoShutdownEntity.state === 'on') {
      autoShutdownBtn.classList.add('on');
      autoShutdownBtn.classList.remove('off');
      autoShutdownBtn.textContent = 'ON';
    } else {
      autoShutdownBtn.classList.add('off');
      autoShutdownBtn.classList.remove('on');
      autoShutdownBtn.textContent = 'OFF';
    }

    // Update input values
    const smokeTemp = this._hass.states[`${this._config.entity}.smoke_temperature`];
    if (smokeTemp) this.querySelector('#smoke-temp').value = smokeTemp.state;

    const heatLevel = this._hass.states[`${this._config.entity}.heat_level`];
    if (heatLevel) this.querySelector('#heat-level').value = heatLevel.state;

    const targetTemp = this._hass.states[`${this._config.entity}.target_temperature`];
    if (targetTemp) this.querySelector('#target-temp').value = targetTemp.state;

    const displayFormat = this._hass.states[`${this._config.entity}.display_format`];
    if (displayFormat) this.querySelector('#display-format').value = displayFormat.state;

    const toggleMode = this._hass.states[`${this._config.entity}.toggle_mode`];
    if (toggleMode) this.querySelector('#toggle-mode').value = toggleMode.state;
  }

  getCardSize() {
    return 6;
  }
}

customElements.define('aduro-stove-card', AduroStoveCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'aduro-stove-card',
  name: 'Aduro Stove Card',
  description: 'A custom card for controlling Aduro stoves'
});
