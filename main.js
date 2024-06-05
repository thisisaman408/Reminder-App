const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const schedule = require("node-schedule");

let mainWindow;
let reminders = [];
let reminderJobs = {};
let popupWindow = null;
let snoozeTimers = {};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

ipcMain.on("setReminder", (event, data) => {
  reminders.push(data);
  scheduleReminder(data);
  event.reply("updateReminderList", reminders);
});

ipcMain.on("editReminder", (event, { index, newData }) => {
  reminders[index] = newData;
  scheduleReminder(newData);
  event.reply("updateReminderList", reminders);
});

ipcMain.on("snoozeReminder", () => {
  if (popupWindow) {
    popupWindow.close();
  }
  const reminderText = popupWindow.reminderText;
  const snoozeDate = new Date(Date.now() + 5 * 60000); // 5 minutes from now
  schedule.scheduleJob(snoozeDate, () => {
    showNotification(reminderText);
  });
  const reminder = reminders.find((r) => r.reminder === reminderText);
  reminder.snoozeTime = snoozeDate.getTime();
  mainWindow.webContents.send("updateReminderList", reminders);
});

ipcMain.on("closeReminder", () => {
  if (popupWindow) {
    popupWindow.close();
  }
  const reminderText = popupWindow.reminderText;
  reminders = reminders.map((reminder) => {
    if (reminder.reminder === reminderText) {
      reminder.done = true;
    }
    return reminder;
  });
  mainWindow.webContents.send("updateReminderList", reminders);
});

function scheduleReminder({ reminder, date, time }) {
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");

  const reminderDate = new Date(year, month - 1, day, hour, minute);

  console.log(`Scheduling reminder for: ${reminderDate}`);

  const job = schedule.scheduleJob(reminderDate, () => {
    console.log(`Triggering reminder: ${reminder}`);
    showNotification(reminder);
  });

  reminderJobs[reminder] = job;
}

function showNotification(reminder) {
  mainWindow.webContents.send("playRingtone");

  popupWindow = new BrowserWindow({
    width: 400,
    height: 200,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  popupWindow.loadFile(path.join(__dirname, "popup.html"));

  popupWindow.once("ready-to-show", () => {
    popupWindow.show();
    popupWindow.webContents.send("setReminderText", reminder);
  });

  popupWindow.reminderText = reminder; // Store the reminder text for snooze and close operations
}
