// Same-origin API: secrets are stored only in Netlify Functions.
const serverApi = {
  withSuccessHandler(success) {
    let failure = error => alert(error.message);
    const call = async (action, payload = {}) => {
      try {
        const response = await fetch('/.netlify/functions/participants', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action, ...payload}), cache: 'no-store'
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') throw new Error(result.message || 'เชื่อมต่อไม่สำเร็จ');
        success(action === 'list' ? result.data : result);
      } catch (error) { failure(error); }
    };
    return {
      withFailureHandler(handler) { failure = handler; return this; },
      getParticipantsData() { return call('list'); },
      registerMultipleParticipants(ids, period) { return call('register', {ids, period}); }
    };
  }
};
