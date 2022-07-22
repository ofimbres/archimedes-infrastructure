function submitForm() {
   // override the submit to save to the database instead of sending email
   const STUDENT_GRADE_CELL = 'O60';
   var grade = getCellValue(STUDENT_GRADE_CELL);
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
    //if (event.origin !== "http://example.org:8080")
    //  return;
    let message = event.data;
    wwsSetCell(STUDENT_NAME_CELL, message.studentName);
    wwsSetCell(STUDENT_ID_CELL, message.studentId);
}

function init() {
    const STUDENT_NAME_CELL = 'B60';
    const STUDENT_ID_CELL = 'G60';

    // https://stackoverflow.com/questions/65695171/why-does-javascript-window-postmessage-create-duplicate-messages
    window.addEventListener("message", updateCellFields, false);
}

init();