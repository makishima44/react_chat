# 🖥️ React Chat App

A simple chat application built with React, inspired by old-school vanilla interfaces. Send and receive messages, manage conversations, and enjoy a minimal, nostalgic UI with a focus on simplicity and usability.

## Direct Messages

The app now supports one-to-one direct messages in addition to room chat.

### Firestore collections

- `users`
  - stores searchable user profiles synced from Firebase Auth
  - fields used by the app: `email`, `emailLower`, `displayName`, `displayNameLower`, `searchPrefixes`
- `directChats`
  - one document per user pair
  - fields used by the app: `memberIds`, `memberProfiles`, `updatedAt`, `lastMessageText`, `lastMessageAt`, `lastMessageSenderId`
- `directChats/{chatId}/messages`
  - message history for a specific direct chat

### Required indexes

Create Firestore composite indexes for:

- `users`: `searchPrefixes` `array-contains` + `displayNameLower` ascending
- `directChats`: `memberIds` `array-contains` + `updatedAt` descending

Single-field ordering for `createdAt` is also required for:

- `directChats/{chatId}/messages`
- existing room messages queries

### Rules expectations

Your Firestore rules should allow:

- authenticated users to read public user profiles from `users`
- authenticated users to create/update only their own `users/{uid}` document
- only members listed in `directChats.memberIds` to read a direct chat
- only members listed in `directChats.memberIds` to read/write documents in `directChats/{chatId}/messages`
