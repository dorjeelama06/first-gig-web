export const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

.gs-wrap {
  min-height: 100vh; min-height: 100dvh;
  display: flex; justify-content: center; align-items: flex-start;
  padding: 12px;
  background: #f7f8fa;
  font-family: 'DM Sans', -apple-system, sans-serif;
  position: relative; overflow-x: hidden;
}
.gs-orb { position: fixed; border-radius: 50%; pointer-events: none; }
.gs-orb1 { width: 300px; height: 300px; top: -80px; right: -60px;
  background: radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%); }
.gs-orb2 { width: 250px; height: 250px; bottom: -50px; left: -50px;
  background: radial-gradient(circle, rgba(255,179,71,0.14) 0%, transparent 70%); }
@media (min-width: 520px) {
  .gs-orb1 { width: 420px; height: 420px; top: -120px; right: -100px; }
  .gs-orb2 { width: 350px; height: 350px; bottom: -80px; left: -80px; }
}

.gs-card {
  width: 100%; max-width: 480px;
  background: #fff;
  border: 1px solid #e5e7eb; border-radius: 20px;
  padding: 20px 16px 16px; position: relative; z-index: 1;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
}
@media (min-width: 520px) {
  .gs-wrap { padding: 40px 20px; }
  .gs-card { padding: 36px 32px 28px; border-radius: 24px; }
}

.gs-header { text-align: center; margin-bottom: 16px; }
.gs-logo-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 2px; }
.gs-logo-icon { font-size: 22px; }
.gs-logo-text {
  font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
  color: #FF6B35;
}
.gs-tagline { color: #999; font-size: 12px; }
@media (min-width: 520px) {
  .gs-header { margin-bottom: 20px; }
  .gs-logo-icon { font-size: 28px; }
  .gs-logo-text { font-size: 26px; }
  .gs-tagline { font-size: 14px; }
}

.gs-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.gs-pbar { flex: 1; height: 4px; border-radius: 4px; background: #e5e7eb; overflow: hidden; }
.gs-pfill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #FF6B35, #FFB347); transition: width 0.4s ease; }
.gs-ptext { color: #aaa; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
@media (min-width: 520px) { .gs-progress { margin-bottom: 22px; } }

.gs-step { min-height: 260px; transition: opacity 0.25s ease, transform 0.25s ease; }
.gs-step.out { opacity: 0; }
.gs-step.in { opacity: 1; transform: translateX(0); }
@media (min-width: 520px) { .gs-step { min-height: 280px; } }

.gs-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; letter-spacing: -0.3px; }
.gs-desc { color: #888; font-size: 13px; margin-bottom: 18px; line-height: 1.45; }
@media (min-width: 520px) {
  .gs-title { font-size: 22px; }
  .gs-desc { font-size: 14px; margin-bottom: 24px; }
}

.gs-field { margin-bottom: 14px; }
.gs-label {
  display: block; color: #666; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;
}
.gs-input {
  width: 100%; padding: 12px 14px; background: #fff;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  color: #1a1a2e; font-size: 16px; outline: none; font-family: inherit;
  transition: border-color 0.2s;
}
.gs-input:focus { border-color: #FF6B35; }
.gs-input::placeholder { color: #bbb; }
.gs-input[type="date"]::-webkit-calendar-picker-indicator { filter: none; opacity: 0.5; }

.gs-roles { display: flex; flex-direction: column; gap: 10px; }
@media (min-width: 380px) { .gs-roles { flex-direction: row; } }
.gs-role {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 12px; background: #fff;
  border: 2px solid #e5e7eb; border-radius: 16px;
  cursor: pointer; color: #1a1a2e; font-family: inherit; transition: all 0.2s;
}
.gs-role:active { transform: scale(0.97); }
.gs-role.active { border-color: #FF6B35; background: rgba(255,107,53,0.05); }
.gs-role-icon { font-size: 30px; }
.gs-role-label { font-size: 14px; font-weight: 600; }
.gs-role-hint { font-size: 11px; color: #999; text-align: center; }
@media (min-width: 520px) {
  .gs-role { padding: 22px 14px; }
  .gs-role-icon { font-size: 34px; }
}

.gs-opts { display: flex; flex-direction: column; gap: 8px; }
.gs-opt {
  padding: 13px 16px; background: #fff;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  color: #1a1a2e; font-size: 15px; text-align: left; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}
.gs-opt:active { transform: scale(0.98); }
.gs-opt.active { border-color: #FF6B35; background: rgba(255,107,53,0.06); }

.gs-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.gs-chip {
  display: flex; align-items: center; gap: 5px; padding: 8px 12px;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 50px; color: #1a1a2e; font-size: 13px; cursor: pointer;
  font-family: inherit; transition: all 0.2s;
}
.gs-chip:active { transform: scale(0.95); }
.gs-chip.active { border-color: #FF6B35; background: rgba(255,107,53,0.07); color: #FF6B35; font-weight: 600; }
.gs-chip-icon { font-size: 16px; }
@media (min-width: 520px) {
  .gs-chip { padding: 9px 14px; }
  .gs-chip-icon { font-size: 18px; }
}

.gs-custom-row { display: flex; gap: 8px; }
.gs-add-btn {
  padding: 12px 14px; background: #FF6B35; color: #FFF; border: none;
  border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 13px;
  white-space: nowrap; font-family: inherit; flex-shrink: 0;
}
.gs-add-btn:active { transform: scale(0.95); }

.gs-avail {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 12px; color: #1a1a2e; font-size: 14px; cursor: pointer;
  font-family: inherit; transition: all 0.2s; text-align: left; width: 100%;
}
.gs-avail:active { transform: scale(0.98); }
.gs-avail.active { border-color: #FF6B35; background: rgba(255,107,53,0.06); }
.gs-check {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ddd;
  display: flex; align-items: center; justify-content: center; font-size: 11px;
  font-weight: 700; flex-shrink: 0; transition: all 0.2s;
}
.gs-check.active { background: #FF6B35; border-color: #FF6B35; color: #FFF; }
.gs-avail-icon { font-size: 16px; flex-shrink: 0; }

.gs-dist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.gs-dist-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
.gs-dist {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 14px 8px; background: #fff;
  border: 1.5px solid #e5e7eb; border-radius: 14px;
  cursor: pointer; font-family: inherit; transition: all 0.2s; color: #1a1a2e;
}
.gs-dist:active { transform: scale(0.96); }
.gs-dist.active { border-color: #FF6B35; background: rgba(255,107,53,0.06); }
.gs-dist-icon { font-size: 22px; }
.gs-dist-label { font-size: 15px; font-weight: 700; }
.gs-dist-desc { font-size: 10px; color: #999; }
@media (min-width: 520px) {
  .gs-dist { padding: 16px 10px; }
  .gs-dist-icon { font-size: 24px; }
  .gs-dist-desc { font-size: 11px; }
}

.gs-exp {
  background: #f7f8fa; border: 1px solid #e5e7eb;
  border-radius: 14px; padding: 12px; margin-bottom: 10px;
}
.gs-exp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.gs-exp-num { color: #FF6B35; font-weight: 700; font-size: 13px; }
.gs-rm-btn {
  background: rgba(220,50,50,0.08); border: none; color: #e03030;
  border-radius: 8px; width: 28px; height: 28px; cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
}
.gs-add-exp {
  width: 100%; padding: 14px; background: rgba(255,107,53,0.04);
  border: 2px dashed rgba(255,107,53,0.3); border-radius: 12px;
  color: #FF6B35; font-weight: 600; font-size: 14px; cursor: pointer;
  font-family: inherit; margin-bottom: 6px;
}
.gs-skip { text-align: center; color: #aaa; font-size: 12px; font-style: italic; margin-top: 6px; }

.gs-textarea {
  width: 100%; padding: 12px 14px; background: #fff;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  color: #1a1a2e; font-size: 16px; outline: none; font-family: inherit;
  min-height: 56px; resize: vertical; margin-top: 8px;
}
.gs-textarea:focus { border-color: #FF6B35; }
.gs-textarea::placeholder { color: #bbb; }

.gs-age {
  display: inline-flex; align-items: baseline; gap: 8px; margin-top: 12px;
  padding: 10px 18px; background: rgba(255,107,53,0.06);
  border: 1px solid rgba(255,107,53,0.2); border-radius: 12px;
}
.gs-age-num { font-size: 24px; font-weight: 800; color: #FF6B35; }
.gs-age-label { color: #999; font-size: 13px; }

.gs-rev {
  display: flex; flex-direction: column; gap: 2px;
  padding: 10px 0; border-bottom: 1px solid #f0f0f0;
}
.gs-rev-label {
  color: #999; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.gs-rev-val { color: #1a1a2e; font-size: 14px; line-height: 1.5; }
@media (min-width: 520px) {
  .gs-rev { flex-direction: row; gap: 12px; }
  .gs-rev-label { width: 100px; flex-shrink: 0; padding-top: 2px; font-size: 12px; }
  .gs-rev-val { font-size: 15px; }
}
.gs-rev-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.gs-rev-tag {
  display: inline-block; padding: 3px 10px; background: rgba(255,107,53,0.08);
  border: 1px solid rgba(255,107,53,0.2); border-radius: 50px;
  font-size: 12px; color: #FF6B35;
}

.gs-nav {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 20px; padding-top: 14px; border-top: 1px solid #e5e7eb;
  gap: 12px;
}
.gs-back {
  padding: 11px 16px; background: transparent;
  border: 1.5px solid #e5e7eb; border-radius: 12px;
  color: #888; font-size: 14px; cursor: pointer; font-family: inherit; font-weight: 500;
}
.gs-back:active { transform: scale(0.96); }
.gs-next {
  padding: 12px 20px; background: linear-gradient(135deg, #FF6B35, #FF8B5E);
  border: none; border-radius: 12px; color: #FFF; font-size: 15px;
  font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s;
  flex-shrink: 0;
}
.gs-next:active { transform: scale(0.96); }
.gs-next.disabled { opacity: 0.4; cursor: not-allowed; }
.gs-next.submit { background: linear-gradient(135deg, #22C55E, #16A34A); padding: 13px 24px; }
@media (min-width: 520px) {
  .gs-nav { margin-top: 24px; padding-top: 18px; }
  .gs-next { padding: 12px 28px; }
}
@media (max-width: 359px) {
  .gs-card { padding: 16px 12px 12px; }
  .gs-title { font-size: 17px; }
  .gs-chip { padding: 7px 10px; font-size: 12px; }
}
`;
