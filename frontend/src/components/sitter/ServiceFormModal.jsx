import React, { useState, useEffect } from "react";
import ServiceFormHeader from "./serviceForm/ServiceFormHeader.jsx";
import ServiceFormAlert from "./serviceForm/ServiceFormAlert.jsx";
import ServiceNameInput from "./serviceForm/ServiceNameInput.jsx";
import ServiceCategorySelect from "./serviceForm/ServiceCategorySelect.jsx";
import PriceStepperInput from "./serviceForm/PriceStepperInput.jsx";
import SpeciesChipSelector from "./serviceForm/SpeciesChipSelector.jsx";
import ServiceDescriptionInput from "./serviceForm/ServiceDescriptionInput.jsx";
import ServiceStatusSelect from "./serviceForm/ServiceStatusSelect.jsx";
import ServiceFormFooter from "./serviceForm/ServiceFormFooter.jsx";
import {
  getPriceUnitHint,
  validateServiceForm,
  buildServicePayload,
} from "../../utils/serviceLogic.js";

/**
 * ServiceFormModal Component
 * 
 * Modular Form Orchestrator:
 * - Composed of specialized subcomponents (Lego blocks) in `components/sitter/serviceForm/`.
 * - Each subcomponent encapsulates its own presentation & events, communicating only data changes to parent.
 * - Manages overall form state, validation on submit, and escape-key handling.
 * 
 * @param {Object} props
 * @param {boolean} [props.isOpen] - Optional modal visibility flag.
 * @param {Function} props.onClose - Modal close handler.
 * @param {Function} props.onSave - Callback receiving validated payload.
 * @param {Object|null} [props.serviceToEdit] - Service object to edit, or null for add mode.
 */
export default function ServiceFormModal({
  onClose,
  onSave,
  serviceToEdit = null,
}) {
  const isEditMode = Boolean(serviceToEdit);

  // 1. Co-located Form State (Initialized directly from serviceToEdit if editing)
  const [serviceName, setServiceName] = useState(() => serviceToEdit?.serviceName || serviceToEdit?.servicename || "");
  const [serviceType, setServiceType] = useState(() => serviceToEdit?.serviceType || serviceToEdit?.servicetype || "daycare");
  const [price, setPrice] = useState(() => Number(serviceToEdit?.price) || 350);
  const [species, setSpecies] = useState(() => {
    if (Array.isArray(serviceToEdit?.species) && serviceToEdit.species.length > 0) {
      return serviceToEdit.species;
    }
    return ["dog"];
  });
  const [description, setDescription] = useState(() => serviceToEdit?.description || "");
  const [status, setStatus] = useState(() => serviceToEdit?.status || "published");

  // 2. Validation State
  const [errors, setErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // 3. Close on Escape key (Active while mounted)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const priceUnitHint = getPriceUnitHint(serviceType);

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    // Call pure validation helper from utils
    const validationResult = validateServiceForm({
      serviceName,
      price,
      species,
      description,
    });

    setErrors(validationResult.errors);

    if (!validationResult.isValid) return;

    // Call pure payload builder from utils
    const payload = buildServicePayload({
      serviceName,
      serviceType,
      price,
      species,
      description,
      status,
      activeService: serviceToEdit,
    });

    if (onSave) onSave(payload);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs transition-opacity duration-200"
      // onClick={(e) => {
      //   if (e.target === e.currentTarget && onClose) onClose();
      // }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      {/* Modal Dialog Card */}
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subcomponent: Modal Header */}
        <ServiceFormHeader isEditMode={isEditMode} onClose={onClose} />

        {/* Subcomponent: Top Incomplete Alert Banner */}
        {hasAttemptedSubmit && hasErrors && <ServiceFormAlert />}

        {/* Form Body: Modular Composition */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subcomponent: Service Name */}
          <ServiceNameInput
            value={serviceName}
            onChange={(val) => {
              setServiceName(val);
              if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: "" }));
            }}
            error={errors.serviceName}
          />

          {/* Subcomponents: Category Dropdown & Stepper Price (2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceCategorySelect
              value={serviceType}
              onChange={setServiceType}
            />
            <PriceStepperInput
              id="service-price-input"
              value={price}
              onChange={(val) => {
                setPrice(val);
                if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
              }}
              unitHint={priceUnitHint}
              error={errors.price}
            />
          </div>

          {/* Subcomponent: Species Chip Selector */}
          <SpeciesChipSelector
            value={species}
            onChange={(val) => {
              setSpecies(val);
              if (errors.species) setErrors((prev) => ({ ...prev, species: "" }));
            }}
            error={errors.species}
          />

          {/* Subcomponent: Description */}
          <ServiceDescriptionInput
            value={description}
            onChange={(val) => {
              setDescription(val);
              if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
            }}
            error={errors.description}
          />

          {/* Subcomponent: Status Dropdown */}
          <ServiceStatusSelect
            value={status}
            onChange={setStatus}
          />

          {/* Subcomponent: Action Footer */}
          <ServiceFormFooter
            onClose={onClose}
            isEditMode={isEditMode}
            showIncompleteWarning={hasAttemptedSubmit && hasErrors}
          />
        </form>
      </div>
    </div>
  );
}
