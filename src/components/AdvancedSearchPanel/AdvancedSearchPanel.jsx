'use client';

import { useState } from 'react';
import styles from './AdvancedSearchPanel.module.css';

export default function AdvancedSearchPanel({ onSearch, onClose }) {
  const [filters, setFilters] = useState({
    query: '',
    senderId: '',
    dateFrom: '',
    dateTo: '',
    fileType: '',
    onlyStarred: false,
    onlyImages: false,
    onlyDocuments: false,
    onlyVideos: false,
    onlyLinks: false,
    chatId: '',
    groupId: '',
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      senderId: '',
      dateFrom: '',
      dateTo: '',
      fileType: '',
      onlyStarred: false,
      onlyImages: false,
      onlyDocuments: false,
      onlyVideos: false,
      onlyLinks: false,
      chatId: '',
      groupId: '',
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Advanced Search</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      <div className={styles.content}>
        <div className={styles.field}>
          <label className={styles.label}>Search Query</label>
          <input
            type="text"
            className={styles.input}
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Enter keywords..."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Sender</label>
          <input
            type="text"
            className={styles.input}
            value={filters.senderId}
            onChange={(e) => handleFilterChange('senderId', e.target.value)}
            placeholder="User ID or email"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Date From</label>
            <input
              type="date"
              className={styles.input}
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Date To</label>
            <input
              type="date"
              className={styles.input}
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>File Type</label>
          <select
            className={styles.select}
            value={filters.fileType}
            onChange={(e) => handleFilterChange('fileType', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="file">Documents</option>
            <option value="audio">Audio</option>
          </select>
        </div>

        <div className={styles.checkboxes}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.onlyStarred}
              onChange={(e) => handleFilterChange('onlyStarred', e.target.checked)}
            />
            <span>Only Starred Messages</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.onlyImages}
              onChange={(e) => handleFilterChange('onlyImages', e.target.checked)}
            />
            <span>Only Images</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.onlyDocuments}
              onChange={(e) => handleFilterChange('onlyDocuments', e.target.checked)}
            />
            <span>Only Documents</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.onlyVideos}
              onChange={(e) => handleFilterChange('onlyVideos', e.target.checked)}
            />
            <span>Only Videos</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={filters.onlyLinks}
              onChange={(e) => handleFilterChange('onlyLinks', e.target.checked)}
            />
            <span>Only Links</span>
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
        <button className={styles.searchButton} onClick={handleSearch}>
          Search
        </button>
      </div>
    </div>
  );
}

