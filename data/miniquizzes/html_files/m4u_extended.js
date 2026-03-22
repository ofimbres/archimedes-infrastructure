/**
 * Archimedes miniquiz helper: launch params from query (assignment_id, student_id, student_name, archimedes_api_base),
 * session JWT from URL hash, POST completion to {archimedes_api_base}/api/v1/assignments/{assignment_id}/completions.
 *
 * Hash: #id_token=<encodeURIComponent(token)> or #access_token=<encodeURIComponent(token)>
 *
 * Student display uses query params student_id / studentId and optional student_name / studentName.
 * data-name-field / data-id-field sit on <td> cells with child <input id="i{cellId}"> — prefer wwsSetCell(cellId, value, c)
 * so formatting/category match the worksheet; never set td.innerHTML (removes inputs; wwsInit / firstInput break).
 * init runs on window load so it runs after wwsInit (avoids data-default overwriting the id field).
 * After filling from launch params, name/id inputs are made read-only (not disabled — keeps hilite/focus working).
 */

function lockLaunchIdentityInputs(nameCellId, idCellId) {
  [nameCellId, idCellId].forEach(function (cid) {
    var el = document.getElementById('i' + cid);
    if (!el) return;
    var tag = el.tagName && el.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return;
    el.readOnly = true;
    el.setAttribute('readonly', 'readonly');
  });
}

function parseHashToken() {
    var raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return { key: '', value: '' };
    var parts = raw.split('&');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var eq = p.indexOf('=');
      if (eq === -1) continue;
      var k = p.slice(0, eq);
      var v = p.slice(eq + 1);
      if (k === 'id_token' || k === 'access_token') {
        try {
          return { key: k, value: decodeURIComponent(v) };
        } catch (e) {
          return { key: k, value: v };
        }
      }
    }
    return { key: '', value: '' };
  }
  
  function getLaunchParams() {
    var sp = new URLSearchParams(window.location.search);
    return {
      archimedesApiBase: (sp.get('archimedes_api_base') || '').replace(/\/+$/, ''),
      assignmentId: sp.get('assignment_id') || '',
      studentId: sp.get('student_id') || sp.get('studentId') || '',
      studentName: sp.get('student_name') || sp.get('studentName') || '',
    };
  }
  
  function parseScoreForArchimedes(grade) {
    if (grade == null || grade === '') return null;
    var s = String(grade).trim();
    if (s === '') return null;
    var pct = s.indexOf('%');
    if (pct !== -1) s = s.slice(0, pct).trim();
    var n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }
  
  function submitToArchimedesApi(grade) {
    var tok = parseHashToken();
    var token = tok.value;
    var launch = getLaunchParams();
    if (!token || !launch.archimedesApiBase || !launch.assignmentId || !launch.studentId) {
      console.warn('Archimedes completion: missing id_token/access_token in hash or launch query params');
      return Promise.resolve(false);
    }
    var url =
      launch.archimedesApiBase +
      '/api/v1/assignments/' +
      encodeURIComponent(launch.assignmentId) +
      '/completions';
    var score = parseScoreForArchimedes(grade);
    var body = { student_id: launch.studentId };
    if (score != null) body.score = score;
  
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            console.warn('Archimedes completion failed', res.status, t);
            return false;
          });
        }
        return true;
      })
      .catch(function (err) {
        console.warn('Archimedes completion error', err);
        return false;
      });
  }
  
  function submitForm() {
    var studentGradeCell = document.querySelectorAll('[data-grade-field]')[0];
    var grade = studentGradeCell ? studentGradeCell.getAttribute('data-cval') : null;
    if (typeof createStaticForm === 'function') {
      try {
        createStaticForm(true);
      } catch (e) {
        /* optional hook from worksheet HTML */
      }
    }
  
    submitToArchimedesApi(grade).then(function (ok) {
      if (ok) {
        document.write('Submitted. You can close this tab and return to Archimedes to see your updated assignments.');
      } else {
        document.write('Could not submit to Archimedes. Return to the assignments page and try again, or contact your teacher.');
      }
    });
  
    return false;
  }
  
  function updateCellFields(data) {
    if (!data || !data.studentId) return;
    var nameTd = document.querySelector('[data-name-field]');
    var idTd = document.querySelector('[data-id-field]');
    if (!nameTd || !idTd) return;

    var nameCellId = nameTd.id;
    var idCellId = idTd.id;
    if (!nameCellId || !idCellId) return;

    var displayName = data.studentName != null ? data.studentName : '';
    var numeric = generateNumericId(data.studentId);

    if (typeof wwsSetCell === 'function') {
      wwsSetCell(nameCellId, displayName, '');
      wwsSetCell(idCellId, numeric, null);
      lockLaunchIdentityInputs(nameCellId, idCellId);
      return;
    }

    var nameInput = document.getElementById('i' + nameCellId);
    var idInput = document.getElementById('i' + idCellId);
    if (nameInput && /^(input|textarea)$/i.test(nameInput.tagName)) {
      nameInput.value = displayName;
    } else {
      nameTd.textContent = displayName;
    }
    nameTd.setAttribute('data-cval', displayName);

    if (idInput && /^(input|textarea)$/i.test(idInput.tagName)) {
      idInput.value = numeric;
    } else {
      idTd.textContent = numeric;
    }
    idTd.setAttribute('data-cval', numeric);

    if (typeof calculate === 'function') {
      calculate(idCellId);
    }

    lockLaunchIdentityInputs(nameCellId, idCellId);
  }

  function init() {
    var launch = getLaunchParams();
    if (!launch.studentId) return;
    updateCellFields({
      studentName: launch.studentName,
      studentId: launch.studentId,
    });
  }

  function generateNumericId(studentId) {
    var hash = hashCode(studentId).toString();
    return hash.substring(hash.length - 5);
  }
  
  function hashCode(str) {
    var hash = 0,
      i,
      chr;
    if (!str || str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return hash;
  }

  window.addEventListener('load', init);
