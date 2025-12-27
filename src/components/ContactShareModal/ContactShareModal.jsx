"use client";

import { useState } from "react";
import Modal from "../Modal/Modal.jsx";
import InputBox from "../InputBox/InputBox.jsx";
import Button from "../Button/Button.jsx";
import styles from "./ContactShareModal.module.css";

export default function ContactShareModal({ isOpen, onClose, onShare }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    onShare({
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
    });

    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
    });
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share Contact">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="contact-name">Contact Name *</label>
          <InputBox
            id="contact-name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Enter contact name"
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-phone">Phone Number</label>
          <InputBox
            id="contact-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="Enter phone number (optional)"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-email">Email Address</label>
          <InputBox
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter email address (optional)"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Share Contact</Button>
        </div>
      </form>
    </Modal>
  );
}

