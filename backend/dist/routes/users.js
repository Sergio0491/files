const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const pool = require('../db');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ message: 'No se proporcionó el token' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'No se proporcionó el token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    req.userId = decoded.userId; 
    next();
  });
}


router.get('/', async (req, res) => {
  try {
    const queryText = 'SELECT first_name, last_name, document_id FROM people';
    const result = await pool.query(queryText);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en /users:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 1) PDF PARA TODOS LOS REGISTROS DE MOTOCARROS
// ==================================================
router.get('/motocars', async (req, res) => {
  try {
    const queryText = `
      SELECT r.*, c.name AS city_name
      FROM motocarros r
      LEFT JOIN cities c ON r.document_city_id = c.id;
    `;
    const result = await pool.query(queryText);

    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader('Content-Disposition', 'attachment; filename=motocarros.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const headerImagePath = path.join(__dirname, 'motocarros.png');

    result.rows.forEach((row) => {
      doc.addPage();
      try {
        doc.image(headerImagePath, { width: 500, align: 'center' });
      } catch (error) {
        console.error('Error cargando la imagen de encabezado:', error);
      }

      doc.moveDown();

      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      };

      const formatBoolean = (value) => {
        return (value === true || value === 'true') ? 'Sí' : (value === false || value === 'false') ? 'No' : 'N/A';
      };

      const fields = [
        { label: 'Tipo de identificación', key: 'id_type' },
        { label: 'Número de identificación', key: 'id_number' },
        { label: 'Lugar de Expedición', key: 'document_city_id' },
        { label: 'Nombres', key: 'name' },
        { label: 'Apellidos', key: 'last_name' },
        { label: 'Fecha de nacimiento', key: 'birth_date', format: formatDate },
        { label: 'Tipo de residencia', key: 'residential_type' },
        { label: 'Área de residencia', key: 'residential_area' },
        { label: 'Barrio de residencia', key: 'residential_neighborhood' },
        { label: 'Dirección', key: 'residential_address' },
        { label: 'Estrato económico', key: 'economic_level' },
        { label: 'Teléfono fijo', key: 'home_phone_number' },
        { label: 'Teléfono móvil', key: 'mobile_number' },
        { label: 'Otro teléfono', key: 'other_phone_number' },
        { label: 'Afiliado a seguridad social', key: 'have_social_security', format: formatBoolean },
        { label: 'EPS', key: 'health_insurance' },
        { label: 'ARL', key: 'ARL' },
        { label: 'AFP', key: 'AFP' },
        { label: 'Nivel educativo', key: 'education_level' },
        { label: 'Tipo de vivienda', key: 'residence_type' },
        { label: 'Nivel de renta', key: 'rent_level' },
        { label: 'Personas a cargo', key: 'have_dependents', format: formatBoolean },
        { label: 'Cantidad de dependientes', key: 'number_dependents' },
        { label: 'Tiempo en actividad', key: 'e_a_time' },
        { label: 'Días a la semana dedicados', key: 'e_a_days_a_week' },
        { label: 'Material transportado', key: 'e_a_material' },
        { label: 'Lugares de transporte', key: 'e_a_places' },
        { label: 'Horario de trabajo', key: 'e_a_work_hours' },
        { label: 'Lugar de disposición de RCD', key: 'e_a_RCD_place' },
        { label: 'Lugar de disposición de material voluminoso', key: 'e_a_voluminous_place' },
        { label: 'Cuenta con permiso de actividad', key: 'e_a_activity_permit', format: formatBoolean },
        { label: 'Pertenece a una empresa', key: 'e_a_belongs_company', format: formatBoolean },
        { label: 'Nombre de la empresa', key: 'e_a_company' },
        { label: 'Este es su único ingreso', key: 'e_a_sole_source_income', format: formatBoolean },
        { label: 'Otra actividad económica', key: 'e_a_other_activity' },
        { label: 'Tuvo otra actividad antes', key: 'e_a_had_previous_activity', format: formatBoolean },
        { label: 'Actividad anterior', key: 'e_a_previous_activity' },
        { label: 'Demanda de su servicio', key: 'e_a_service_demand' },
        { label: 'Número de Placa', key: 'v_d_plate_number' },
        { label: 'Color del vehículo', key: 'v_d_vehicle_color' },
        { label: 'Número de matrícula', key: 'v_d_registration_number' },
        { label: 'Nombre del propietario', key: 'v_d_owner_name' },
        { label: 'Número del chasis', key: 'v_d_chassis_number' },
        { label: 'Cuenta con SOAT', key: 'v_d_has_SOAT', format: formatBoolean },
        { label: 'Cuenta con tecnomecánica', key: 'v_d_has_technomechanical', format: formatBoolean },
        { label: 'Cuenta con licencia de conducción', key: 'd_d_has_valid_license', format: formatBoolean },
        { label: 'Número de licencia', key: 'd_d_license_number' },
        { label: 'Notas adicionales', key: 'extra_notes' },
        { label: 'Longitud', key: 'lon' },
        { label: 'Latitud', key: 'lat' },
        { label: 'Ciudad', key: 'city_name' }
      ];

      fields.forEach((field) => {
        const value = field.format ? field.format(row[field.key]) : row[field.key] || 'N/A';
        if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }
        doc.font('Helvetica-Bold').text(`${field.label}: `, { continued: true });
        doc.font('Helvetica').text(value);
        doc.moveDown(0.5);
      });

      // Firma si existe
      if (row.signature) {
        try {
          const base64Data = row.signature.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, { fit: [250, 100], align: 'center' });
          doc.moveDown();
        } catch (err) {
          console.error('Error procesando la firma:', err);
          doc.text('Firma no disponible o inválida');
        }
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error en /motocars:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 2) PDF PARA TODOS LOS REGISTROS DE RECICLADORES
// ==================================================
router.get('/recyclers', async (req, res) => {
  try {
    const queryText = `
      SELECT r.*, c.name AS city_name
      FROM recyclers r
      LEFT JOIN cities c ON r.document_city_id = c.id;
    `;
    const result = await pool.query(queryText);

    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader('Content-Disposition', 'attachment; filename=recyclers.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const headerImagePath = path.join(__dirname, 'header_image.png');

    result.rows.forEach((row) => {
      doc.addPage();
      try {
        doc.image(headerImagePath, { width: 500, align: 'center' });
      } catch (error) {
        console.error('Error cargando la imagen de encabezado:', error);
      }

      doc.moveDown();

      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      };

      const formatBoolean = (value) => {
        return value === true ? 'Sí' : value === false ? 'No' : 'N/A';
      };

      const fields = [
        { label: 'Nombres', key: 'name' },
        { label: 'Apellidos', key: 'last_name' },
        { label: 'Tipo de Documento de identidad', key: 'id_type' },
        { label: 'Número de Documento', key: 'id_number' },
        { label: 'Ciudad de expedición del documento', key: 'city_name' },
        { label: 'Fecha de Nacimiento', key: 'birth_date', format: formatDate },
        { label: 'Lugar de Nacimiento', key: 'birth_city_id' },
        { label: 'Género', key: 'gender' },
        { label: 'Teléfono Fijo', key: 'home_phone_number' },
        { label: 'Celular', key: 'mobile_number' },
        { label: 'Cabeza de Hogar', key: 'head_of_household', format: formatBoolean },
        { label: 'Dirección de Residencia', key: 'residential_address' },
        { label: 'Nivel Educativo', key: 'education_level' },
        { label: 'Licencia de Conducción', key: 'e_a_driver_license' },
        { label: 'Condición de Afiliación al Sistema de Seguridad Social', key: 'social_security_status' },
        { label: 'Pensión', key: 'receives_pension', format: formatBoolean },
        { label: 'Tipo de Vivienda', key: 'housing_type' },
        { label: 'Situación de la Vivienda', key: 'housing_status' },
        { label: 'Número de Personas que Dependen de la Actividad del Reciclador', key: 'numbers_dependents' },
        { label: '¿Cuánto tiempo hace que se dedica al reciclaje?', key: 'e_a_time_in_activity' },
        { label: '¿Qué hacía antes de dedicarse al reciclaje?', key: 'e_a_previous_activity_recycling' },
        { label: '¿Cuántos días a la semana dedica a esta actividad?', key: 'e_a_days_per_week_recycling' },
        { label: '¿Cuántas horas al día se dedica a esta actividad?', key: 'e_a_hours_per_day_recovery' },
        { label: '¿Alterna el reciclaje con otro trabajo?', key: 'e_a_has_other_work_activity', format: formatBoolean },
        { label: '¿Cuál otro trabajo realiza?', key: 'e_a_other_activity' },
        { label: '¿En qué barrios y horarios ejerce su actividad de reciclador?', key: 'e_a_work_area_and_hours' },
        { label: '¿A qué organización de recicladores pertenece?', key: 'e_a_belongs_to_recycler_organization', format: formatBoolean },
        { label: 'Nombre de la organización', key: 'e_a_organization_name' },
        { label: 'Medio de Transporte utilizado', key: 'e_a_transportation_method' },
        { label: 'Descripción del Medio de Transporte', key: 'e_a_transport_method_description' },
        { label: 'Lugar de Recuperación de Material', key: 'e_a_recovery_place' },
        { label: 'Beneficio realizado al material obtenido', key: 'e_a_material_benefit' },
        { label: 'Tipo de material que recupera semanalmente', key: 'e_a_weekly_recycled_material_type' },
        { label: 'Sitio de venta del material', key: 'e_a_material_sale_location' },
        { label: 'Ingresos en la semana anterior por concepto de reciclaje', key: 'e_a_weekly_income_from_recycled_material' },
        { label: '¿Cómo cree que se podrían mejorar las condiciones para los recicladores en el Municipio?', key: 'improve_conditions_idea' },
        { label: '¿Le gustaría participar de capacitaciones o actividades de la secretaría de medio ambiente o de la alcaldía?', key: 'willing_to_participate', format: formatBoolean },
        { label: 'Lugar de encuesta (Longitud)', key: 'lon' },
        { label: 'Lugar de encuesta (Latitud)', key: 'lat' }
      ];

      fields.forEach((field) => {
        const value = field.format ? field.format(row[field.key]) : row[field.key] || 'N/A';
        if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
        }
        doc.font('Helvetica-Bold').text(`${field.label}: `, { continued: true });
        doc.font('Helvetica').text(value);
        doc.moveDown(0.5);
      });

      // Firma si existe
      if (row.signature) {
        try {
          const base64Data = row.signature.replace(/^data:image\/\w+;base64,/, "");
          const imgBuffer = Buffer.from(base64Data, "base64");
          doc.image(imgBuffer, { fit: [250, 100], align: "center" });
          doc.moveDown();
        } catch (err) {
          console.error("Error procesando la firma:", err);
          doc.text("Firma no disponible o inválida");
        }
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error en /recyclers:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 3) PDF INDIVIDUAL POR ID - MOTOCARROS
// ==================================================
router.get('/motocars/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT r.*, c.name AS city_name
      FROM motocarros r
      LEFT JOIN cities c ON r.document_city_id = c.id
      WHERE r.id = $1
    `;
    const result = await pool.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró el motocarro con el ID especificado.' });
    }

    const row = result.rows[0];
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', `attachment; filename=motocarro_${id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const headerImagePath = path.join(__dirname, 'motocarros.png');

    try {
      doc.image(headerImagePath, { width: 500, align: 'center' });
    } catch (error) {
      console.error('Error cargando la imagen de encabezado:', error);
    }

    doc.moveDown();

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const formatBoolean = (value) => {
      return (value === true || value === 'true') ? 'Sí' : 
             (value === false || value === 'false') ? 'No' : 'N/A';
    };

    const fields = [
      { label: 'Tipo de identificación', key: 'id_type' },
      { label: 'Número de identificación', key: 'id_number' },
      { label: 'Lugar de Expedición', key: 'city_name' },
      { label: 'Nombres', key: 'name' },
      { label: 'Apellidos', key: 'last_name' },
      { label: 'Fecha de nacimiento', key: 'birth_date', format: formatDate },
      { label: 'Tipo de residencia', key: 'residential_type' },
      { label: 'Área de residencia', key: 'residential_area' },
      { label: 'Barrio de residencia', key: 'residential_neighborhood' },
      { label: 'Dirección', key: 'residential_address' },
      { label: 'Estrato económico', key: 'economic_level' },
      { label: 'Teléfono fijo', key: 'home_phone_number' },
      { label: 'Teléfono móvil', key: 'mobile_number' },
      { label: 'Otro teléfono', key: 'other_phone_number' },
      { label: 'Afiliado a seguridad social', key: 'have_social_security', format: formatBoolean },
      { label: 'EPS', key: 'health_insurance' },
      { label: 'ARL', key: 'ARL' },
      { label: 'AFP', key: 'AFP' },
      { label: 'Nivel educativo', key: 'education_level' },
      { label: 'Tipo de vivienda', key: 'residence_type' },
      { label: 'Nivel de renta', key: 'rent_level' },
      { label: 'Personas a cargo', key: 'have_dependents', format: formatBoolean },
      { label: 'Cantidad de dependientes', key: 'number_dependents' },
      { label: 'Tiempo en actividad', key: 'e_a_time' },
      { label: 'Días a la semana dedicados', key: 'e_a_days_a_week' },
      { label: 'Material transportado', key: 'e_a_material' },
      { label: 'Lugares de transporte', key: 'e_a_places' },
      { label: 'Horario de trabajo', key: 'e_a_work_hours' },
      { label: 'Lugar de disposición de RCD', key: 'e_a_RCD_place' },
      { label: 'Lugar de disposición de material voluminoso', key: 'e_a_voluminous_place' },
      { label: 'Cuenta con permiso de actividad', key: 'e_a_activity_permit', format: formatBoolean },
      { label: 'Pertenece a una empresa', key: 'e_a_belongs_company', format: formatBoolean },
      { label: 'Nombre de la empresa', key: 'e_a_company' },
      { label: 'Este es su único ingreso', key: 'e_a_sole_source_income', format: formatBoolean },
      { label: 'Otra actividad económica', key: 'e_a_other_activity' },
      { label: 'Tuvo otra actividad antes', key: 'e_a_had_previous_activity', format: formatBoolean },
      { label: 'Actividad anterior', key: 'e_a_previous_activity' },
      { label: 'Demanda de su servicio', key: 'e_a_service_demand' },
      { label: 'Número de Placa', key: 'v_d_plate_number' },
      { label: 'Color del vehículo', key: 'v_d_vehicle_color' },
      { label: 'Número de matrícula', key: 'v_d_registration_number' },
      { label: 'Nombre del propietario', key: 'v_d_owner_name' },
      { label: 'Número del chasis', key: 'v_d_chassis_number' },
      { label: 'Cuenta con SOAT', key: 'v_d_has_SOAT', format: formatBoolean },
      { label: 'Cuenta con tecnomecánica', key: 'v_d_has_technomechanical', format: formatBoolean },
      { label: 'Cuenta con licencia de conducción', key: 'd_d_has_valid_license', format: formatBoolean },
      { label: 'Número de licencia', key: 'd_d_license_number' },
      { label: 'Notas adicionales', key: 'extra_notes' },
      { label: 'Longitud', key: 'lon' },
      { label: 'Latitud', key: 'lat' },
      { label: 'Ciudad', key: 'city_name' }
    ];

    fields.forEach((field) => {
      const value = field.format ? field.format(row[field.key]) : row[field.key] || 'N/A';
      doc.font('Helvetica-Bold').text(`${field.label}: `, { continued: true });
      doc.font('Helvetica').text(value);
      doc.moveDown(0.5);
    });

    // Firma si existe
    if (row.signature) {
      try {
        const base64Data = row.signature.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, { fit: [250, 100], align: 'center' });
        doc.moveDown();
      } catch (err) {
        console.error('Error procesando la firma:', err);
        doc.text('Firma no disponible o inválida');
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error en /motocars/:id/pdf:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 4) PDF INDIVIDUAL POR ID - RECICLADORES
// ==================================================
router.get('/recyclers/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const queryText = `
      SELECT r.*, c.name AS city_name
      FROM recyclers r
      LEFT JOIN cities c ON r.document_city_id = c.id
      WHERE r.id = $1
    `;
    const result = await pool.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró el reciclador con el ID especificado.' });
    }

    const row = result.rows[0];
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', `attachment; filename=recycler_${id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const headerImagePath = path.join(__dirname, 'header_image.png');

    try {
      doc.image(headerImagePath, { width: 500, align: 'center' });
    } catch (error) {
      console.error('Error cargando la imagen de encabezado:', error);
    }

    doc.moveDown();

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const formatBoolean = (value) => {
      return value === true ? 'Sí' : value === false ? 'No' : 'N/A';
    };

    const fields = [
      { label: 'Nombres', key: 'name' },
      { label: 'Apellidos', key: 'last_name' },
      { label: 'Tipo de Documento de identidad', key: 'id_type' },
      { label: 'Número de Documento', key: 'id_number' },
      { label: 'Ciudad de expedición del documento', key: 'city_name' },
      { label: 'Fecha de Nacimiento', key: 'birth_date', format: formatDate },
      { label: 'Lugar de Nacimiento', key: 'birth_city_id' },
      { label: 'Género', key: 'gender' },
      { label: 'Teléfono Fijo', key: 'home_phone_number' },
      { label: 'Celular', key: 'mobile_number' },
      { label: 'Cabeza de Hogar', key: 'head_of_household', format: formatBoolean },
      { label: 'Dirección de Residencia', key: 'residential_address' },
      { label: 'Nivel Educativo', key: 'education_level' },
      { label: 'Licencia de Conducción', key: 'e_a_driver_license' },
      { label: 'Condición de Afiliación al Sistema de Seguridad Social', key: 'social_security_status' },
      { label: 'Pensión', key: 'receives_pension', format: formatBoolean },
      { label: 'Tipo de Vivienda', key: 'housing_type' },
      { label: 'Situación de la Vivienda', key: 'housing_status' },
      { label: 'Número de Personas que Dependen de la Actividad del Reciclador', key: 'numbers_dependents' },
      { label: '¿Cuánto tiempo hace que se dedica al reciclaje?', key: 'e_a_time_in_activity' },
      { label: '¿Qué hacía antes de dedicarse al reciclaje?', key: 'e_a_previous_activity_recycling' },
      { label: '¿Cuántos días a la semana dedica a esta actividad?', key: 'e_a_days_per_week_recycling' },
      { label: '¿Cuántas horas al día se dedica a esta actividad?', key: 'e_a_hours_per_day_recovery' },
      { label: '¿Alterna el reciclaje con otro trabajo?', key: 'e_a_has_other_work_activity', format: formatBoolean },
      { label: '¿Cuál otro trabajo realiza?', key: 'e_a_other_activity' },
      { label: '¿En qué barrios y horarios ejerce su actividad de reciclador?', key: 'e_a_work_area_and_hours' },
      { label: '¿A qué organización de recicladores pertenece?', key: 'e_a_belongs_to_recycler_organization', format: formatBoolean },
      { label: 'Nombre de la organización', key: 'e_a_organization_name' },
      { label: 'Medio de Transporte utilizado', key: 'e_a_transportation_method' },
      { label: 'Descripción del Medio de Transporte', key: 'e_a_transport_method_description' },
      { label: 'Lugar de Recuperación de Material', key: 'e_a_recovery_place' },
      { label: 'Beneficio realizado al material obtenido', key: 'e_a_material_benefit' },
      { label: 'Tipo de material que recupera semanalmente', key: 'e_a_weekly_recycled_material_type' },
      { label: 'Sitio de venta del material', key: 'e_a_material_sale_location' },
      { label: 'Ingresos en la semana anterior por concepto de reciclaje', key: 'e_a_weekly_income_from_recycled_material' },
      { label: '¿Cómo cree que se podrían mejorar las condiciones para los recicladores en el Municipio?', key: 'improve_conditions_idea' },
      { label: '¿Le gustaría participar de capacitaciones o actividades de la secretaría de medio ambiente o de la alcaldía?', key: 'willing_to_participate', format: formatBoolean },
      { label: 'Lugar de encuesta (Longitud)', key: 'lon' },
      { label: 'Lugar de encuesta (Latitud)', key: 'lat' }
    ];

    fields.forEach((field) => {
      const value = field.format ? field.format(row[field.key]) : row[field.key] || 'N/A';
      doc.font('Helvetica-Bold').text(`${field.label}: `, { continued: true });
      doc.font('Helvetica').text(value);
      doc.moveDown(0.5);
    });

    // Firma si existe
    if (row.signature) {
      try {
        const base64Data = row.signature.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");
        doc.image(imgBuffer, { fit: [250, 100], align: "center" });
        doc.moveDown();
      } catch (err) {
        console.error("Error procesando la firma:", err);
        doc.text("Firma no disponible o inválida");
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error en /recyclers/:id/pdf:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 5) LISTA DE MOTOCARROS (id, name, last_name, id_number)
// ==================================================
router.get('/motocars/list', async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, last_name, id_number
      FROM motocarros
      ORDER BY id;
    `;
    const result = await pool.query(queryText);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en /motocars/list:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ==================================================
// 6) LISTA DE RECICLADORES (id, name, last_name, id_number)
// ==================================================
router.get('/recyclers/list', async (req, res) => {
  try {
    const queryText = `
      SELECT id, name, last_name, id_number
      FROM recyclers
      ORDER BY id;
    `;
    const result = await pool.query(queryText);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error en /recyclers/list:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;