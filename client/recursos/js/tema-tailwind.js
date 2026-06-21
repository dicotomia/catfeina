/**
 * Configuración de estilos y extensión del tema para Tailwind CSS.
 */

tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                'principal': "#88ca5e",
                'principal-oscuro': "#d68b22",
                'fondo-claro': "#f7f8f6",
                'fondo-oscuro': "#181e14",
                'texto-principal': "#181511",
                'texto-secundario': "#897961"
            },
            fontFamily: {
                'waterlily': ["Waterlily", "cursive"], 
                'display': ["Plus Jakarta Sans", "sans-serif"],
                'body': ["Noto Sans", "sans-serif"]
            },
            borderRadius: {
                DEFAULT: "0.5rem",
                lg: "1rem",
                xl: "1.5rem",
                full: "9999px"
            }
        }
    }
};
