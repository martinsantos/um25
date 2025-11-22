export const imageFixes = {
    // Salud
    "ultimamilla_hospital_perrupato_-_cctv_20250415_194857_s1174127604.png": "ultimamilla_hospital_a_italo_perrupato_-_sdi_20250415_222810_s3545963600.png",
    "ultimamilla_hospital_luis_lagomaggiore_-_redes_y_comunicaciones_20250415_195035_s1161757453.png": "ultimamilla_hospital_a_italo_perrupato_-_mantenimiento_sistema_de_detecc_20250416_103736_s1374061609.png",
    "ultimamilla_hospital_el_carmen_-_cctv_20250415_194719_s2063934815.png": "ultimamilla_hospital_a_italo_perrupato_-_soporte_it_20250415_222611_s2701217668.png",
    "ultimamilla_hospital_español_-_cctv_20250415_194534_s2099651420.png": "ultimamilla_hospital_a_italo_perrupato_-_sdi_20250416_005255_s2503609866.png",
    "ultimamilla_clínica_francesa_-_cctv_20250415_193606_s2122645699.png": "ultimamilla_hospital_a_italo_perrupato_-_sdi_20250416_013304_s2247458949.png",

    // Bodegas
    "ultimamilla_bodega_salentein_-_redes_y_comunicaciones_20250415_191625_s3466462505.png": "ultimamilla_bodega_antigal_-_sdi_20250416_080155_s3478363168.png",
    "ultimamilla_bodega_zuccardi_-_redes_y_comunicaciones_20250415_191833_s3533272950.png": "ultimamilla_bodega_caro_-_sdi_20250415_222222_s2468356529.png",

    // Constructoras
    "ultimamilla_iscamet_-_redes_y_comunicaciones_20250415_202148_s3643050088.png": "ultimamilla_isi_solutions_-_redes_y_comunicaciones_20250415_194242_s1045715784.png",

    // Gobierno
    "ultimamilla_dirección_general_de_escuelas_mendoza_-_redes_y_comunicacio_20250415_200551_s2618084894.png": "ultimamilla_gobierno_de_mendoza_-_software_a_medida_20250415_203235_s1132993027.png",
    "ultimamilla_municipalidad_de_las_heras_-_redes_y_comunicaciones_20250415_202357_s2486777832.png": "ultimamilla_gobierno_de_mendoza_-_software_a_medida_20250415_203235_s1132993027.png"
};

export function getFixedImage(filename) {
    return imageFixes[filename] || filename;
}
