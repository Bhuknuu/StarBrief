"use client";

import styles from "./Sidebar.module.css";
import { SearchBar } from "./SearchBar";
import { FilterState, OpportunityCategory, CATEGORY_LABELS, DEFAULT_FILTERS } from "@/lib/types";

interface SidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ filters, onFilterChange, isOpen, onClose }: SidebarProps) {
  const toggleCategory = (cat: OpportunityCategory) => {
    const newCats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: newCats });
  };

  return (
    <>
      {isOpen && <div className={styles.mobileOverlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div 
            className={styles.brand} 
            onClick={() => { onFilterChange(DEFAULT_FILTERS); if (onClose) onClose(); }}
            style={{ cursor: 'pointer' }}
            title="Reset Dashboard"
          >
            <span className={styles.logo}>✶</span>
            <h1 className={styles.title}>StarBrief</h1>
          </div>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          )}
        </div>

      <div className={styles.scrollArea}>
        <div className={styles.section}>
          <SearchBar
            value={filters.search}
            onChange={(val) => onFilterChange({ ...filters, search: val })}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Categories</h3>
          <div className={styles.checkboxList}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.categories.length === 0}
                onChange={() => onFilterChange({ ...filters, categories: [] })}
                className={styles.checkbox}
              />
              <span className={styles.labelText}>All Categories</span>
            </label>
            {(Object.entries(CATEGORY_LABELS) as [OpportunityCategory, string][]).map(([key, label]) => (
              <label key={key} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.categories.includes(key)}
                  onChange={() => toggleCategory(key)}
                  className={styles.checkbox}
                />
                <span className={styles.labelText}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Preferences</h3>
          <label className={styles.toggleLabel}>
            <span>Remote Only</span>
            <input
              type="checkbox"
              className={styles.toggle}
              checked={filters.isRemote === true}
              onChange={(e) => onFilterChange({ ...filters, isRemote: e.target.checked ? true : null })}
            />
          </label>
          <label className={styles.toggleLabel}>
            <span>Paid Only</span>
            <input
              type="checkbox"
              className={styles.toggle}
              checked={filters.isPaid === true}
              onChange={(e) => onFilterChange({ ...filters, isPaid: e.target.checked ? true : null })}
            />
          </label>
          <label className={styles.toggleLabel}>
            <span>Show Saved</span>
            <input
              type="checkbox"
              className={styles.toggle}
              checked={filters.showSavedOnly}
              onChange={(e) => onFilterChange({ ...filters, showSavedOnly: e.target.checked })}
            />
          </label>
          <label className={styles.toggleLabel}>
            <span style={{ color: "var(--priority-critical)" }}>Dismissed Bin</span>
            <input
              type="checkbox"
              className={styles.toggle}
              checked={filters.showDismissed}
              onChange={(e) => onFilterChange({ ...filters, showDismissed: e.target.checked })}
            />
          </label>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.profile}>
          <div className={styles.avatar}>U</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>User</span>
            <span className={styles.userRole}>Student</span>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
