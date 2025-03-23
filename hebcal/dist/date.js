function formatHebrewDate(date) {
  const hDate = new hebcal.HDate(date);
  const day = hDate.getDate();
  const month = hDate.getMonthName();
  const year = hDate.getFullYear();
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });

  let special = "";
  if (date.getDay() === 6) {
    special = " — Shabbat";
  }

  const hebrewDateStr = `${weekday} ${day} ${month} ${year}${special}`;
  const gregorian = date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return [hebrewDateStr, gregorian];
}

window.addEventListener('DOMContentLoaded', function () {
  // Always show today
  const today = new Date();
  const [todayHebrew, todayGregorian] = formatHebrewDate(today);
  document.getElementById("todayHebrew").textContent = todayHebrew;
  document.getElementById("todayGregorian").textContent = todayGregorian;

  const dateInput = document.getElementById("datePicker");
  dateInput.value = ""; // no default selection

  const selectedBlock = document.getElementById("selectedBlock");

  dateInput.addEventListener("change", function () {
    const parts = this.value.split("-");
    if (parts.length === 3) {
      const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(selectedDate)) {
        const [selHebrew, selGregorian] = formatHebrewDate(selectedDate);
        document.getElementById("selectedHebrew").textContent = selHebrew;
        document.getElementById("selectedGregorian").textContent = selGregorian;
        selectedBlock.classList.remove("hidden");
      }
    }
  });
});
