(function () {
  const form = document.getElementById("registroForm");
  const estado = document.getElementById("estadoFormulario");

  if (!form || !estado) {
    return;
  }

  const fieldNames = [
    "nombre",
    "apellido",
    "email",
    "telefono",
    "fechaNacimiento",
    "pais",
    "servicio",
    "clinica",
    "motivo",
    "aceptaPoliticas"
  ];

  const clinicOptionsByCountry = {
    EEUU: ["Texas", "Georgia", "Florida"],
    "Reino Unido": ["Londres", "Manchester"]
  };

  const phoneRulesByCountry = {
    EEUU: {
      flag: "🇺🇸",
      code: "+1",
      placeholder: "+1 202 555 0147",
      labelText: "(+1, 10 digitos)",
      helperText: "EEUU: +1 y 10 digitos",
      digitsRequired: 10
    },
    "Reino Unido": {
      flag: "🇬🇧",
      code: "+44",
      placeholder: "+44 20 7946 0958",
      labelText: "(+44, 10 digitos)",
      helperText: "Reino Unido: +44 y 10 digitos",
      digitsRequired: 10
    }
  };

  function getField(name) {
    return form.elements[name];
  }

  function getErrorNode(name) {
    return form.querySelector('[data-error-for="' + name + '"]');
  }

  function normalizeValue(value) {
    return String(value || "").trim();
  }

  function setError(name, message) {
    const input = getField(name);
    const errorNode = getErrorNode(name);

    if (!input || !errorNode) {
      return;
    }

    input.classList.remove("border-green-500", "focus:border-green-500", "focus:ring-green-100");
    input.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-100");
    input.setAttribute("aria-invalid", "true");

    if (name === "telefono") {
      const codigoSelect = getField("telefonoCodigo");
      if (codigoSelect) {
        codigoSelect.classList.remove("border-green-500", "focus:border-green-500", "focus:ring-green-100");
        codigoSelect.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-100");
      }
    }

    errorNode.textContent = message;
    errorNode.classList.remove("hidden");
  }

  function clearError(name) {
    const input = getField(name);
    const errorNode = getErrorNode(name);

    if (!input || !errorNode) {
      return;
    }

    input.classList.remove(
      "border-red-500",
      "focus:border-red-500",
      "focus:ring-red-100",
      "border-green-500",
      "focus:border-green-500",
      "focus:ring-green-100"
    );
    input.removeAttribute("aria-invalid");

    if (name === "telefono") {
      const codigoSelect = getField("telefonoCodigo");
      if (codigoSelect) {
        codigoSelect.classList.remove(
          "border-red-500",
          "focus:border-red-500",
          "focus:ring-red-100",
          "border-green-500",
          "focus:border-green-500",
          "focus:ring-green-100"
        );
      }
    }

    errorNode.textContent = "";
    errorNode.classList.add("hidden");
  }

  function setValid(name) {
    const input = getField(name);

    if (!input) {
      return;
    }

    clearError(name);

    if (input.type !== "checkbox") {
      input.classList.add("border-green-500", "focus:border-green-500", "focus:ring-green-100");
    }

    if (name === "telefono") {
      const codigoSelect = getField("telefonoCodigo");
      if (codigoSelect) {
        codigoSelect.classList.add("border-green-500", "focus:border-green-500", "focus:ring-green-100");
      }
    }
  }

  function clearState() {
    estado.className = "hidden rounded-lg border px-4 py-3 text-sm";
    estado.textContent = "";
  }

  function showState(success, message) {
    estado.className = "rounded-lg border px-4 py-3 text-sm";

    if (success) {
      estado.classList.add("border-green-500", "bg-green-100", "text-green-800");
    } else {
      estado.classList.add("border-red-300", "bg-red-50", "text-red-700");
    }

    estado.textContent = message;
  }

  function validateNombre(value) {
    if (!value) {
      return "El nombre es obligatorio.";
    }

    if (value.length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]+$/.test(value)) {
      return "El nombre solo puede contener letras, espacios, apostrofes o guiones.";
    }

    return "";
  }

  function validateApellido(value) {
    if (!value) {
      return "El apellido es obligatorio.";
    }

    if (value.length < 2) {
      return "El apellido debe tener al menos 2 caracteres.";
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'\-\s]+$/.test(value)) {
      return "El apellido solo puede contener letras, espacios, apostrofes o guiones.";
    }

    return "";
  }

  function validateEmail(value) {
    if (!value) {
      return "El correo electronico es obligatorio.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return "Ingresa un correo electronico valido. Ejemplo: nombre@dominio.com.";
    }

    return "";
  }

  function validateTelefono(value) {
    const pais = normalizeValue(getField("pais") ? getField("pais").value : "");
    const codigoSelect = getField("telefonoCodigo");
    const codigoPais = normalizeValue(codigoSelect ? codigoSelect.value : "");
    const effectivePais = codigoPais || pais;
    const phoneRule = phoneRulesByCountry[effectivePais];

    if (!phoneRule) {
      return "Selecciona un pais para habilitar el codigo de telefono.";
    }

    if (!value) {
      return "El telefono es obligatorio.";
    }

    if (!/^[()\-\s0-9]+$/.test(value)) {
      return "Ingresa solo el numero local sin codigo, usando digitos y opcionalmente espacios o guiones.";
    }

    const digits = value.replace(/\D/g, "");
    if (digits.length !== phoneRule.digitsRequired) {
      return "Para " + effectivePais + " ingresa exactamente " + phoneRule.digitsRequired + " digitos despues del codigo " + phoneRule.code + ".";
    }

    if (effectivePais === "EEUU" && !/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) {
      return "Para EEUU el numero debe ser real (NANP), por ejemplo 2025550147 despues del +1.";
    }

    if (effectivePais === "Reino Unido" && !/^[1-9]\d{9}$/.test(digits)) {
      return "Para Reino Unido ingresa 10 digitos validos despues del +44, por ejemplo 2079460958.";
    }

    return "";
  }

  function syncPhoneFieldByCountry() {
    const paisSelect = getField("pais");
    const codigoSelect = getField("telefonoCodigo");
    const telefonoInput = getField("telefono");
    const telefonoLabelCode = document.getElementById("telefonoCodigoLabel");
    const banderaNode = document.getElementById("telefonoBanderaSeleccionada");

    if (!paisSelect || !codigoSelect || !telefonoInput || !telefonoLabelCode || !banderaNode) {
      return;
    }

    const selectedPais = normalizeValue(paisSelect.value) || normalizeValue(codigoSelect.value);
    const phoneRule = phoneRulesByCountry[selectedPais];

    if (!phoneRule) {
      codigoSelect.value = "";
      codigoSelect.disabled = false;
      telefonoLabelCode.textContent = "(EEUU +1: 10 digitos | Reino Unido +44: 10 digitos)";
      banderaNode.textContent = "🌐";
      telefonoInput.placeholder = "Selecciona pais para sugerir codigo";
      telefonoInput.title = "Selecciona un pais para definir codigo y cantidad de digitos";
      return;
    }

    codigoSelect.value = selectedPais;
    codigoSelect.disabled = false;
    banderaNode.textContent = phoneRule.flag;
    telefonoLabelCode.textContent = phoneRule.labelText;
    telefonoInput.placeholder = "Ejemplo: " + phoneRule.placeholder.replace(phoneRule.code + " ", "");
    telefonoInput.title = phoneRule.helperText;
  }

  function syncCountryFromPhoneCode() {
    const paisSelect = getField("pais");
    const codigoSelect = getField("telefonoCodigo");

    if (!paisSelect || !codigoSelect) {
      return;
    }

    const selectedCodePais = normalizeValue(codigoSelect.value);
    if (selectedCodePais && paisSelect.value !== selectedCodePais) {
      paisSelect.value = selectedCodePais;
    }
  }

  function validateFechaNacimiento(value) {
    if (!value) {
      return "La fecha de nacimiento es obligatoria.";
    }

    const date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) {
      return "Ingresa una fecha de nacimiento valida.";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      return "La fecha de nacimiento no puede ser futura.";
    }

    const adultDate = new Date(date);
    adultDate.setFullYear(adultDate.getFullYear() + 18);
    if (adultDate > today) {
      return "Debes ser mayor de 18 anos para registrarte.";
    }

    return "";
  }

  function resetClinicaOptions() {
    const clinicaSelect = getField("clinica");

    if (!clinicaSelect) {
      return;
    }

    clinicaSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Selecciona una opcion";
    clinicaSelect.appendChild(defaultOption);
  }

  function syncClinicaOptions() {
    const paisSelect = getField("pais");
    const clinicaSelect = getField("clinica");

    if (!paisSelect || !clinicaSelect) {
      return;
    }

    const selectedPais = normalizeValue(paisSelect.value);
    const options = clinicOptionsByCountry[selectedPais] || [];
    const previousClinic = normalizeValue(clinicaSelect.value);

    resetClinicaOptions();
    clinicaSelect.disabled = options.length === 0;

    options.forEach(function (clinicName) {
      const option = document.createElement("option");
      option.value = clinicName;
      option.textContent = clinicName;
      clinicaSelect.appendChild(option);
    });

    if (options.includes(previousClinic)) {
      clinicaSelect.value = previousClinic;
    } else {
      clinicaSelect.value = "";
    }
  }

  function validateSelect(value, label) {
    if (!value) {
      return "Selecciona una opcion para " + label + ".";
    }

    return "";
  }

  function validateMotivo(value) {
    if (!value) {
      return "El motivo de consulta es obligatorio.";
    }

    if (value.length < 15) {
      return "Describe tu motivo con al menos 15 caracteres.";
    }

    if (value.length > 500) {
      return "El motivo no debe superar los 500 caracteres.";
    }

    return "";
  }

  function validateCheckbox(checked) {
    if (!checked) {
      return "Debes aceptar la validacion de datos para continuar.";
    }

    return "";
  }

  function validateField(name) {
    const input = getField(name);

    if (!input) {
      return true;
    }

    const value = normalizeValue(input.value);
    let message = "";

    if (name === "nombre") {
      message = validateNombre(value);
    }

    if (name === "apellido") {
      message = validateApellido(value);
    }

    if (name === "email") {
      message = validateEmail(value);
    }

    if (name === "telefono") {
      message = validateTelefono(value);
    }

    if (name === "fechaNacimiento") {
      message = validateFechaNacimiento(value);
    }

    if (name === "pais") {
      message = validateSelect(value, "el pais de residencia");
    }

    if (name === "servicio") {
      message = validateSelect(value, "el servicio solicitado");
    }

    if (name === "clinica") {
      message = validateSelect(value, "la clinica preferida");
    }

    if (name === "motivo") {
      message = validateMotivo(value);
    }

    if (name === "aceptaPoliticas") {
      message = validateCheckbox(input.checked);
    }

    if (message) {
      setError(name, message);
      return false;
    }

    setValid(name);
    return true;
  }

  function validateForm() {
    let valid = true;

    clearState();

    fieldNames.forEach(function (name) {
      const isFieldValid = validateField(name);
      if (!isFieldValid && valid) {
        const firstInvalid = getField(name);
        if (firstInvalid && typeof firstInvalid.focus === "function") {
          firstInvalid.focus();
        }
      }
      valid = valid && isFieldValid;
    });

    return valid;
  }

  function attachRealtimeValidation(name) {
    const input = getField(name);

    if (!input) {
      return;
    }

    const liveEvent = input.tagName === "SELECT" || input.type === "checkbox" ? "change" : "input";

    input.addEventListener(liveEvent, function () {
      validateField(name);
      clearState();
    });

    input.addEventListener("blur", function () {
      validateField(name);
    });
  }

  fieldNames.forEach(function (name) {
    attachRealtimeValidation(name);
  });

  const paisSelect = getField("pais");
  if (paisSelect) {
    paisSelect.addEventListener("change", function () {
      syncPhoneFieldByCountry();
      syncClinicaOptions();
      clearError("clinica");
      validateField("telefono");
      validateField("pais");
      clearState();
    });
  }

  const telefonoCodigoSelect = getField("telefonoCodigo");
  if (telefonoCodigoSelect) {
    telefonoCodigoSelect.addEventListener("change", function () {
      syncCountryFromPhoneCode();
      syncPhoneFieldByCountry();
      syncClinicaOptions();
      clearError("clinica");
      validateField("telefono");
      validateField("pais");
      clearState();
    });
  }

  syncPhoneFieldByCountry();
  syncClinicaOptions();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      showState(false, "Revisa los campos marcados y corrige los errores para continuar.");
      return;
    }

    showState(true, "Datos validados correctamente. Tu aplicacion esta lista para enviarse.");
  });

  form.addEventListener("reset", function () {
    fieldNames.forEach(function (name) {
      clearError(name);
    });

    clearState();

    requestAnimationFrame(function () {
      syncPhoneFieldByCountry();
      syncClinicaOptions();
    });
  });
})();
