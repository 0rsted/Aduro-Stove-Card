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
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hidden {
          display: none;
        }
        .pellet-section {
          margin-bottom: 16px;
        }
        .pellet-bar {
          height: 32px;
          background: var(--divider-color);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          margin-top: 8px;
        }
        .pellet-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        .pellet-fill.low {
          background: linear-gradient(90deg, #f44336, #ff9800);
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
          font-size: 13px;
          color: var(--secondary-text-color);
          font-weight: 500;
        }
        .control-input, .control-select {
          padding: 10px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .control-input:focus, .control-select:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .toggle-button {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
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
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }
        .action-button {
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: var(--primary-color);
          color: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: opacity 0.2s;
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
        
        <div class="pellet-section">
          <div class="control-label">Pellet Level</div>
          <div class="pellet-bar">
            <div class="pellet-fill" id="pellet-fill">0%</div>
          </div>
        </div>

        <div class="controls-grid">
          <div class="control-item">
            <label class="control-label">Power</label>
            <button class="toggle-button off" id="power-btn">OFF</button>
          </div>
          
          <div class="control-item">
            <label class="control-label">Display Format</label>
            <div id="display-format-value" style="padding: 10px 12px; background: var(--divider-color); border-radius: 8px;">-</div>
          </div>
          
          <div class="control-item">
            <label class="control-label">Smoke Temperature</label>
            <div id="smoke-temp-value" style="padding: 10px 12px; background: var(--divider-color); border-radius: 8px;">-</div>
          </div>
          
          <div class="control-item">
            <label class="control-label">Heat Level</label>
            <input type="number" class="control-input" id="heat-level" min="1" max="5" step="1">
          </div>
          
          <div class="control-item">
            <label class="control-label">Target Temperature</label>
            <input type="number" class="control-input" id="target-temp" min="5" max="30" step="0.5">
          </div>
          
          <div class="control-item">
            <label class="control-label">Toggle Mode</label>
            <button class="action-button" id="toggle-mode-btn">Toggle Mode</button>
          </div>
          
          <div class="control-item">
            <label class="control-label">Auto Resume After Wood</label>
            <button class="toggle-button off" id="auto-resume-btn">OFF</button>
          </div>
          
          <div class="control-item">
            <label class="control-label">Auto Shutdown Low Pellets</label>
            <button class="toggle-button off" id="auto-shutdown-btn">OFF</button>
          </div>
        </div>

        <div class="action-buttons">
          <button class="action-button" id="clean-btn">Clean Stove</button>
          <button class="action-button" id="refill-btn">Refill Pellets</button>
        </div>
      </div>
    `;
    
    this.appendChild(card);
    this._setupEventListeners();
  }

  _getEntityId(suffix) {
    // Entity naming pattern: sensor.aduro_h1_[suffix] or switch.aduro_h1_[suffix]
    const baseEntity = this._config.entity;
    return `${baseEntity}_${suffix}`;
  }

  _setupEventListeners() {
    // Power switch
    this.querySelector('#power-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('power');
      this._hass.callService('switch', 'toggle', { entity_id: entityId });
    });

    // Heat level
    this.querySelector('#heat-level').addEventListener('change', (e) => {
      const entityId = this._getEntityId('heatlevel');
      this._hass.callService('number', 'set_value', { 
        entity_id: entityId,
        value: parseFloat(e.target.value)
      });
    });

    // Target temperature
    this.querySelector('#target-temp').addEventListener('change', (e) => {
      const entityId = this._getEntityId('temperature');
      this._hass.callService('number', 'set_value', { 
        entity_id: entityId,
        value: parseFloat(e.target.value)
      });
    });

    // Toggle mode button
    this.querySelector('#toggle-mode-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('toggle_mode');
      this._hass.callService('button', 'press', { entity_id: entityId });
    });

    // Auto resume switch
    this.querySelector('#auto-resume-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('auto_resume_wood');
      this._hass.callService('switch', 'toggle', { entity_id: entityId });
    });

    // Auto shutdown switch
    this.querySelector('#auto-shutdown-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('auto_shutdown');
      this._hass.callService('switch', 'toggle', { entity_id: entityId });
    });

    // Clean stove button
    this.querySelector('#clean-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('clean_stove');
      this._hass.callService('button', 'press', { entity_id: entityId });
    });

    // Refill pellets button
    this.querySelector('#refill-btn').addEventListener('click', () => {
      const entityId = this._getEntityId('refill_pellets');
      this._hass.callService('button', 'press', { entity_id: entityId });
    });
  }

  _updateContent() {
    if (!this._hass || !this._config) return;

    // Update change in progress icon
    const changeInProgressEntity = this._hass.states[this._getEntityId('change_in_progress')];
    const changeIcon = this.querySelector('#change-icon');
    if (changeInProgressEntity && changeInProgressEntity.state === 'true') {
      changeIcon.classList.remove('hidden');
    } else {
      changeIcon.classList.add('hidden');
    }

    // Update pellet percentage
    const pelletEntity = this._hass.states[this._getEntityId('pellet_percentage')];
    if (pelletEntity) {
      const percentage = parseInt(pelletEntity.state) || 0;
      const pelletFill = this.querySelector('#pellet-fill');
      pelletFill.style.width = `${percentage}%`;
      pelletFill.textContent = `${percentage}%`;
      
      // Change color if low
      if (percentage <= 20) {
        pelletFill.classList.add('low');
      } else {
        pelletFill.classList.remove('low');
      }
    }

    // Update power switch
    const powerEntity = this._hass.states[this._getEntityId('power')];
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

    // Update display format (read-only display)
    const displayFormatEntity = this._hass.states[this._getEntityId('display_format')];
    if (displayFormatEntity) {
      this.querySelector('#display-format-value').textContent = displayFormatEntity.state || '-';
    }

    // Update smoke temperature (read-only display)
    const smokeTempEntity = this._hass.states[this._getEntityId('smoke_temp')];
    if (smokeTempEntity) {
      this.querySelector('#smoke-temp-value').textContent = smokeTempEntity.state ? `${smokeTempEntity.state}°C` : '-';
    }

    // Update heat level input
    const heatLevelEntity = this._hass.states[this._getEntityId('heatlevel')];
    if (heatLevelEntity) {
      this.querySelector('#heat-level').value = heatLevelEntity.state;
    }

    // Update target temperature input
    const targetTempEntity = this._hass.states[this._getEntityId('temperature')];
    if (targetTempEntity) {
      this.querySelector('#target-temp').value = targetTempEntity.state;
    }

    // Update auto resume switch
    const autoResumeEntity = this._hass.states[this._getEntityId('auto_resume_wood')];
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

    // Update auto shutdown switch
    const autoShutdownEntity = this._hass.states[this._getEntityId('auto_shutdown')];
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
