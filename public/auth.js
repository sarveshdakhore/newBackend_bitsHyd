document.addEventListener("DOMContentLoaded", () => {
  const loginToggle = document.getElementById("login-toggle");
  const signupToggle = document.getElementById("signup-toggle");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginPasswordForm = document.getElementById("login-password-form");
  const loginOtpForm = document.getElementById("login-otp-form");
  const otpVerification = document.getElementById("otp-verification");
  const toggleOtpLogin = document.getElementById("toggle-otp-login");
  const forgotPassword = document.getElementById("forgot-password");
  const forgotPasswordModal = document.getElementById("forgot-password-modal");
  const forgotPasswordForm = document.getElementById("forgot-password-form");
  const forgotPasswordEmail = document.getElementById("forgot-password-email");
  const forgotPasswordMessage = document.getElementById(
    "forgot-password-message"
  );
  const closeModal = document.querySelector(".close");
  const resendOtpButton = document.getElementById("resend-otp-button");
  const otpTimer = document.getElementById("otp-timer");
  const messageDiv = document.getElementById("message");
  const sendOtpButton = document.getElementById("send-otp-button");
  const loginEmail = document.getElementById("login-email");
  const loginOtpEmail = document.getElementById("login-otp-email");
  const verifyOtpButton = document.getElementById("verify-otp-button");
  const logoutLink = document.getElementById("logout-link");

  let otpTimerInterval;
  let canSendOtp = true;
  let otpSent = false;

  // Check if the user is already logged in
  if (!logoutLink.classList.contains("hidden")) {
    window.location.href = "/";
  }

  toggleOtpLogin.addEventListener("change", () => {
    if (toggleOtpLogin.checked) {
      loginPasswordForm.style.display = "none";
      loginOtpForm.style.display = "block";
      loginOtpEmail.value = loginEmail.value; // Sync email value
      if (otpSent) {
        otpVerification.style.display = "block";
        sendOtpButton.style.display = "none";
      } else {
        otpVerification.style.display = "none";
        sendOtpButton.style.display = "block";
      }
    } else {
      loginPasswordForm.style.display = "block";
      loginOtpForm.style.display = "none";
      otpVerification.style.display = "none";
      loginEmail.value = loginOtpEmail.value; // Sync email value
    }
  });

  loginToggle.addEventListener("click", () => {
    loginToggle.classList.add("active");
    signupToggle.classList.remove("active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  });

  signupToggle.addEventListener("click", () => {
    signupToggle.classList.add("active");
    loginToggle.classList.remove("active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  loginPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = document.getElementById("login-password").value;
    const loginButton = loginPasswordForm.querySelector("button");

    setLoading(loginButton, true);

    try {
      const response = await fetch("/sign/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp: false }),
      });
      const result = await response.json();
      showMessage(result.message);
      if (response.ok) {
        console.log(result.data);
        storeUserData(result.data);
        setCookie("user", JSON.stringify(result.data), 7); // Set user data in cookie for 7 days
        const userCookie = getCookie("user");
        console.log("User Cookie:", userCookie);

        // Show logout link and hide login/signup link
        document.getElementById("login-signup-link").classList.add("hidden");
        document.getElementById("logout-link").classList.remove("hidden");

        // redirect to home page
        window.location.href = "/";
      }
    } catch (error) {
      showMessage("Error logging in.");
    } finally {
      setLoading(loginButton, false);
    }
  });

  loginOtpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!canSendOtp) return;
    const email = loginOtpEmail.value;
    const otpButton = loginOtpForm.querySelector("button");

    setLoading(otpButton, true);

    try {
      const response = await fetch("/sign/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: true }),
      });
      const result = await response.json();
      showMessage(result.message);
      if (response.ok) {
        otpSent = true;
        otpVerification.style.display = "block";
        sendOtpButton.style.display = "none";
        startOtpTimer();
      }
    } catch (error) {
      showMessage("Error sending OTP.");
    } finally {
      setLoading(otpButton, false);
    }
  });

  verifyOtpButton.addEventListener("click", async () => {
    const email = loginOtpEmail.value;
    const otp = document.getElementById("otp-input").value;

    setLoading(verifyOtpButton, true);

    try {
      const response = await fetch("/sign/login_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();
      showMessage(result.message);
      if (response.ok) {
        storeUserData(result.data);
        setCookie("user", JSON.stringify(result.data), 7); // Set user data in cookie for 7 days
        // Show logout link and hide login/signup link
        document.getElementById("login-signup-link").classList.add("hidden");
        document.getElementById("logout-link").classList.remove("hidden");
        window.location.href = "/";
      }
    } catch (error) {
      showMessage("Error verifying OTP.");
    } finally {
      setLoading(verifyOtpButton, false);
    }
  });

  resendOtpButton.addEventListener("click", async () => {
    if (!canSendOtp) return;
    const email = loginOtpEmail.value;

    setLoading(resendOtpButton, true);

    try {
      const response = await fetch("/sign/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: true }),
      });
      const result = await response.json();
      showMessage(result.message);
      if (response.ok) {
        startOtpTimer();
      }
    } catch (error) {
      showMessage("Error resending OTP.");
    } finally {
      setLoading(resendOtpButton, false);
    }
  });

  forgotPassword.addEventListener("click", () => {
    forgotPasswordEmail.value = loginEmail.value;
    forgotPasswordModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    forgotPasswordModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == forgotPasswordModal) {
      forgotPasswordModal.style.display = "none";
    }
  });

  forgotPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = forgotPasswordEmail.value;
    const forgotPasswordButton = forgotPasswordForm.querySelector("button");

    setLoading(forgotPasswordButton, true);

    try {
      const response = await fetch("/sign/forget_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      forgotPasswordMessage.textContent = result.message;
      if (response.ok) {
        forgotPasswordMessage.style.color = "green";
      } else {
        forgotPasswordMessage.style.color = "red";
      }
    } catch (error) {
      forgotPasswordMessage.textContent = "Error sending reset password link.";
      forgotPasswordMessage.style.color = "red";
    } finally {
      setLoading(forgotPasswordButton, false);
    }
  });

  document
    .getElementById("signup-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const passwordC = document.getElementById(
        "signup-password-confirm"
      ).value;
      const signupButton = document
        .getElementById("signup-form")
        .querySelector("button");

      setLoading(signupButton, true);

      try {
        const response = await fetch("/sign/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, passwordC }),
        });
        const result = await response.json();
        showMessage(result.message);
        if (response.ok) {
          // Redirect to verification page or show a message
        }
      } catch (error) {
        showMessage("Error signing up.");
      } finally {
        setLoading(signupButton, false);
      }
    });

  function showMessage(message) {
    messageDiv.textContent = message;
    messageDiv.style.display = "block";
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 5000);
  }

  function startOtpTimer() {
    let timeLeft = 60;
    canSendOtp = false;
    resendOtpButton.disabled = true;
    resendOtpButton.style.opacity = "0.5";
    otpTimer.textContent = `Resend OTP in ${timeLeft}s`;

    otpTimerInterval = setInterval(() => {
      timeLeft -= 1;
      otpTimer.textContent = `Resend OTP in ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(otpTimerInterval);
        canSendOtp = true;
        resendOtpButton.disabled = false;
        resendOtpButton.style.opacity = "1";
        otpTimer.textContent = "";
      }
    }, 1000);
  }

  function storeUserData(data) {
    localStorage.setItem("user", JSON.stringify(data));
  }

  function setLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = '<div class="spinner"></div> Loading...';
    } else {
      button.disabled = false;
      button.innerHTML = button.getAttribute("data-original-text");
    }
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  document.querySelectorAll("button").forEach((button) => {
    button.setAttribute("data-original-text", button.innerHTML);
  });
});
