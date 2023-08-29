function submitForm() {
   // override the submit to save to the database instead of sending email
   const studentGradeCell = document.querySelectorAll('[data-grade-field]')[0];
   var grade = studentGradeCell.getAttribute('data-cval');
   var worksheetCopy = createStaticForm(true);
   
   const message = {
      grade: grade,
      worksheetCopy: worksheetCopy
   };

   window.parent.postMessage(message, '*');
   document.write('Submitting results. Do not refresh the page');

   return false;
}

function updateCellFields(event) {
    const studentNameElement = document.querySelectorAll('[data-name-field]')[0];
    const studentIdElement = document.querySelectorAll('[data-id-field]')[0];

    let message = event.data;

    studentNameElement.innerHTML = message.studentName;
    studentIdElement.innerHTML = generateNumericId(message.studentId);

    studentIdElement.setAttribute('data-cval', generateNumericId(message.studentId));
    calculate(studentIdElement.id);
}

function init() {
    // https://stackoverflow.com/questions/65695171/why-does-javascript-window-postmessage-create-duplicate-messages
    window.addEventListener("message", updateCellFields, false);
}

function generateNumericId(studentId) {
    const hash = hashCode(studentId).toString();
    return hash.substring(hash.length - 5);
}

function hashCode(str) {
    var hash = 0,
      i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

init();