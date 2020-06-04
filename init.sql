CREATE TABLE hosts (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name text NOT NULL,
   host text NOT NULL,
   key text NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE backups (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   type text NOT NULL,
   name text NOT NULL,
   host text NOT NULL,
   port INTEGER NOT NULL,
   username text,
   password text,
   path text NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE plans (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name text NOT NULL,
   hostId INTEGER NOT NULL,
   backupId INTEGER NOT NULL,
   type text NOT NULL,
   src text,
   mon INTEGER,
   tue INTEGER,
   wed INTEGER,
   thu INTEGER,
   fri INTEGER,
   sat INTEGER,
   sun INTEGER,
   time text NOT NULL,
   keptCount INTEGER NOT NULL,
   keptPeriod text NOT NULL,
   state text NOT NULL,
   last INTEGER,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE activities (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   desc text NOT NULL,
   hostId INTEGER NOT NULL,
   state text NOT NULL,
   start INTEGER NOT NULL,
   end INTEGER NOT NULL,
   initiator text NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE warnings (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   desc text NOT NULL,
   hostId INTEGER NOT NULL,
   state text NOT NULL,
   date INTEGER NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE parameters (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   name text NOT NULL,
   value text NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

CREATE TABLE users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   username text NOT NULL,
   password text NOT NULL,
   createdAt INTEGER NOT NULL,
   updatedAt INTEGER NOT NULL
);

insert into users (username, password, createdAt, updatedAt) values ('admin', 'admin',datetime(), datetime());