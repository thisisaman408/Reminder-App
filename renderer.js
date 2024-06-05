const { ipcRenderer } = require("electron");

document.getElementById("setReminderBtn").addEventListener("click", () => {
  const reminder = document.getElementById("reminderInput").value;
  const date = document.getElementById("reminderDate").value;
  const time = document.getElementById("reminderTime").value;
  ipcRenderer.send("setReminder", { reminder, date, time });
});

document.getElementById("decreaseHour").addEventListener("click", () => {
  const timeInput = document.getElementById("reminderTime");
  const [hour, minute] = timeInput.value.split(":");
  const newHour = (parseInt(hour) - 1 + 24) % 24;
  timeInput.value = `${newHour.toString().padStart(2, "0")}:${minute}`;
});

document.getElementById("increaseHour").addEventListener("click", () => {
  const timeInput = document.getElementById("reminderTime");
  const [hour, minute] = timeInput.value.split(":");
  const newHour = (parseInt(hour) + 1) % 24;
  timeInput.value = `${newHour.toString().padStart(2, "0")}:${minute}`;
});

document.getElementById("decreaseMinute").addEventListener("click", () => {
  const timeInput = document.getElementById("reminderTime");
  const [hour, minute] = timeInput.value.split(":");
  const newMinute = (parseInt(minute) - 1 + 60) % 60;
  timeInput.value = `${hour}:${newMinute.toString().padStart(2, "0")}`;
});

document.getElementById("increaseMinute").addEventListener("click", () => {
  const timeInput = document.getElementById("reminderTime");
  const [hour, minute] = timeInput.value.split(":");
  const newMinute = (parseInt(minute) + 1) % 60;
  timeInput.value = `${hour}:${newMinute.toString().padStart(2, "0")}`;
});

ipcRenderer.on("updateReminderList", (event, reminders) => {
  const reminderList = document.getElementById("reminderList");
  reminderList.innerHTML = "";
  reminders.forEach((reminderData, index) => {
    const reminderItem = document.createElement("li");
    reminderItem.innerText = `${reminderData.date} ${reminderData.time}: ${reminderData.reminder}`;
    if (reminderData.done) {
      const doneMark = document.createElement("span");
      doneMark.innerText = " (Done)";
      doneMark.style.color = "red";
      doneMark.style.fontWeight = "bold";
      doneMark.style.backgroundColor = "#ffcccc";
      doneMark.style.borderRadius = "5px";
      doneMark.style.padding = "2px 5px";
      doneMark.style.marginLeft = "10px";
      reminderItem.appendChild(doneMark);
    } else if (reminderData.snoozeTime) {
      const timeLeft = Math.ceil(
        (reminderData.snoozeTime - Date.now()) / 1000 / 60
      );
      const snoozeMark = document.createElement("span");
      snoozeMark.innerText = ` (Snoozed - ${timeLeft} mins left)`;
      snoozeMark.style.color = "orange";
      snoozeMark.style.fontWeight = "bold";
      snoozeMark.style.backgroundColor = "#ffeeba";
      snoozeMark.style.borderRadius = "5px";
      snoozeMark.style.padding = "2px 5px";
      snoozeMark.style.marginLeft = "10px";
      reminderItem.appendChild(snoozeMark);
    } else {
      const timeLeft = Math.ceil(
        (new Date(reminderData.date + " " + reminderData.time).getTime() -
          Date.now()) /
          1000 /
          60
      );
      const timerMark = document.createElement("span");
      timerMark.innerText = ` (${timeLeft} mins left)`;
      timerMark.style.color = "blue";
      timerMark.style.fontWeight = "bold";
      timerMark.style.backgroundColor = "#cce5ff";
      timerMark.style.borderRadius = "5px";
      timerMark.style.padding = "2px 5px";
      timerMark.style.marginLeft = "10px";
      reminderItem.appendChild(timerMark);
    }
    const editButton = document.createElement("button");
    editButton.innerText = "Edit";
    editButton.onclick = () => editReminder(index, reminderData);
    reminderItem.appendChild(editButton);
    reminderList.appendChild(reminderItem);
  });
});

function editReminder(index, reminderData) {
  const reminderInput = document.getElementById("reminderInput");
  const reminderDate = document.getElementById("reminderDate");
  const reminderTime = document.getElementById("reminderTime");

  reminderInput.value = reminderData.reminder;
  reminderDate.value = reminderData.date;
  reminderTime.value = reminderData.time;

  const saveButton = document.createElement("button");
  saveButton.innerText = "Save";
  saveButton.onclick = () => {
    const updatedReminder = {
      reminder: reminderInput.value,
      date: reminderDate.value,
      time: reminderTime.value,
    };
    ipcRenderer.send("editReminder", { index, newData: updatedReminder });
    document.body.removeChild(saveButton);
  };
  document.body.appendChild(saveButton);
}

ipcRenderer.on("playRingtone", () => {
  const audio = new Audio("ringtone.mp3");
  audio.loop = true;

  audio.play().catch((err) => {
    console.error("Error playing audio file:", err);
  });

  ipcRenderer.on("stopRingtone", () => {
    audio.pause();
  });
});
