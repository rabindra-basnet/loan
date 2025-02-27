// frappe.listview_settings["DartaProcess System"] = {
//         onload: function (listview) {
//             var style = document.createElement("style"); 
//             style.innerHTML = `
//                 .layout-side-section {
//                     display: none !important; 
//                 }
//                 .btn-reset.sidebar-toggle-btn {
//                     display: none !important;
//                 }
//             `;
    
//             document.head.appendChild(style);
//         }
//     };

// frappe.ready(function() {
//         if (frappe.utils.get_route_str() === 'List/DartaProcess System') {
//             const style = document.createElement("style");
//             style.innerHTML = `
//                 .layout-side-section,
//                 .btn-reset.sidebar-toggle-btn {
//                     display: none !important;
//                 }
//             `;
//             document.head.appendChild(style);
//         }
//     });