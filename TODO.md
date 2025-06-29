# TODO
All pending tasks and futures features.

## [priority-tasks]

- **Implementar filtros de fechas**
  - Description: Integrar filtros para fechas en "tracks", sirve para otros módulos.
  - State: Por hacer.
  - Priority: Media.

## [future-features]

- **Módulos de configuración del sistema Listo (Inicial)**
  - Ciudades [nombre_ciudad]
  - Barrios [nombre_barrio, ciudad]
  - Estratos [nombre_estrato]
  - Zonas [nombre_zona]
  - Cargos [nombre_cargo]
  - Días no laborables [oficina, fecha, descripción]
  - Medios de pago [descripcion]
  - Responsables de pago [nombre, apellido, documento, estado]
  - Bancos [nombre_banco]
  - Configuración móvil []
  - Tipos de archivos [descripcion, medio, fecha_vencimiento]
  - Archivos obligatorios [proceso, tipo_archivo, cantidad]
  - Moras por mes [año, mes, porcentaje_de_interes]
  - Abogados [documento, nombre, apellido, direccion, telefono, celular, correo, nombre_empresa, numero_tarjeta_profesional]

- **Módulos de configuración del sistema Listo (Parámetros)**
  - Oficinas 
    GENERAL [nombre_oficina, maneja_valores_sin_miles, permite_editar_telefono_cliente, validar_documento_cliente, permite_crear_cliente_en_varias_rutas, listar_causantes_en_movil, manejar_codeudores, dias_maxcimos_para_anular, validar_gps_en_movil, frecuencia_de_rastreo, correo, correo_de_contacto]
    CRÉDITOS [valor_por_visita, permite_crear_credito_sin_solicitud, valor_minimo_de_credito, valor_maximo_de_credito, porcentaje_minimo, porcentaje_maximo, cobrar_mora_en_el_siguiente_corte, abono_mixto_devuelve_interes, realizar_cobro_adicional, permite_venta_directa_bodega, permite_ventas_articulos_por_menor_valor, diario, semanal, quincenal, mensual, bloquear_renovaciones]
    PENALIZACIÓN [fecha_inicio, porcentaje_minimo_pago_cuotas, dias_penalizar_credito_diario, dias_penalizar_credito_semanal, dias_penalizar_credito_mensual, dias_penalizar_credito_quincenal, porcentaje_max_penalizar_credito, porcentaje_penalizacion_credito, penalizar_por, manejar_devolucion_penalizacion, aplicar_cambios_a_todos_creditos]
    NOTIFICACIONES [enviar_sms_cliente, maneja_codigo_de_verificacion_en_solicitud, enviar_correo_cliente, enviar_recordatorio_pago, enviar_notificacion_abono_correo, verificar_creditos_directos]
    PARÁMETROS NOTIFICACIONES []
  - Rutas [descripcion, nit, nombre_empresa, direccion, telefono, celular, ciudad, oficina, facturar, permitir_abonos, mensaje_factura, permitir_crear_clientes, cuadre_ruta_movil, abonos_con_medios_pago_movil]
  - Actualizar parámetros [dias_para_anular_solicitudes_automaticas, dias_para_generar_solicitudes_automaticas, numero_minimo_cuotas_mostrar_amarillo, numero_minimo_cuotas_mostrar_rojo, permite_crear_cliente_movil, permite_crear_creditos_simultaneos_cliente, porcentaje_interes_mora, programar_proxima_fecha_pago_movil, validar_cupo_cliente, valor_defecto_dias_maximos_deuda_cliente]


## [ideas]

- **Gestionar clientes en diferentes escritorios**