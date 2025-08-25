import React from "react";
import Style from "../Style/formularioDenuncias.module.css";

export default function FormularioDenuncias() {
  return (
    <div className={`container mt-5 mb-5 ${Style.formContainer}`}>
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-center mb-4">Formulario de Denuncias</h3>
              <p className="text-muted text-center mb-4">
                Completa la siguiente información de forma clara y concisa.
              </p>

              <form className="needs-validation" noValidate>
                {/* Código de empleado */}
                <div className="mb-3">
                  <label htmlFor="codigoEmpleado" className="form-label">Código de Empleado</label>
                  <input type="number" className="form-control" id="codigoEmpleado" placeholder="Ej. 1234" maxLength={4} min={0} required />
                  <div className="form-text">Debe ser un número de 4 dígitos.</div>
                </div>

                {/* Nombre del empleado */}
                <div className="mb-3">
                  <label htmlFor="nombreEmpleado" className="form-label">Nombre del Empleado</label>
                  <input type="text" className="form-control" id="nombreEmpleado" placeholder="Ej. Ana López" required />
                </div>

                {/* Razón de la denuncia */}
                <div className="mb-3">
                  <label htmlFor="razonDenuncia" className="form-label">Motivo de la Denuncia</label>
                  <textarea className="form-control" id="razonDenuncia" rows="4" placeholder="Describe lo sucedido con detalles relevantes..." required ></textarea>
                </div>

                {/* Botón */}
                <div className="d-grid">
                  <button type="submit" className={`btn btn-success ${Style.botonEnviar}`}>
                    Enviar Denuncia
                  </button>
                </div>
              </form>

              <p className="text-muted mt-3 small text-center">
                Esta información será tratada con confidencialidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
