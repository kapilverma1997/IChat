'use client';

import { useState, useEffect } from 'react';
import styles from './GlobalSearchModal.module.css';
import SearchBar from '../SearchBar/SearchBar';
import AdvancedSearchPanel from '../AdvancedSearchPanel/AdvancedSearchPanel';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchSavedSearches();
    }
  }, [isOpen]);

  const fetchSavedSearches = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/search/saved', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.savedSearches || []);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const performSearch = async (searchQuery, searchFilters = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      if (searchFilters) {
        Object.keys(searchFilters).forEach((key) => {
          if (searchFilters[key]) {
            params.append(key, searchFilters[key]);
          }
        });
      }

      const response = await fetch(`/api/messages/search?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.messages || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    performSearch(searchQuery, filters);
  };

  const handleAdvancedSearch = (searchFilters) => {
    setFilters(searchFilters);
    performSearch(query, searchFilters);
    setShowAdvanced(false);
  };

  const saveSearch = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          filters,
        }),
      });

      fetchSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const loadSavedSearch = (savedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    performSearch(savedSearch.query, savedSearch.filters);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Search</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.searchSection}>
          <SearchBar onSearch={handleSearch} />
          <div className={styles.actions}>
            <button
              className={styles.advancedButton}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </button>
            {results.length > 0 && (
              <button className={styles.saveButton} onClick={saveSearch}>
                Save Search
              </button>
            )}
          </div>

          {showAdvanced && (
            <AdvancedSearchPanel
              onSearch={handleAdvancedSearch}
              onClose={() => setShowAdvanced(false)}
            />
          )}
        </div>

        {savedSearches.length > 0 && (
          <div className={styles.savedSearches}>
            <h3 className={styles.sectionTitle}>Saved Searches</h3>
            <div className={styles.savedList}>
              {savedSearches.map((search) => (
                <button
                  key={search._id}
                  className={styles.savedItem}
                  onClick={() => loadSavedSearch(search)}
                >
                  {search.name || search.query}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.results}>
          {loading ? (
            <div className={styles.loading}>Searching...</div>
          ) : results.length === 0 && query ? (
            <div className={styles.empty}>No results found</div>
          ) : results.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((message) => (
                <div key={message._id} className={styles.resultItem}>
                  <div className={styles.resultHeader}>
                    <span className={styles.sender}>
                      {message.senderId?.name || 'Unknown'}
                    </span>
                    <span className={styles.time}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div className={styles.resultContent}>
                    {message.content}
                  </div>
                  {message.type !== 'text' && (
                    <div className={styles.resultType}>
                      Type: {message.type}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className={styles.empty}>Enter a search query to begin</div>
          )}
        </div>
      </div>
    </div>
  );
}

