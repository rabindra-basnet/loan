class NepaliDateManager {
    static get today() {
        return {
            ad: new Date().toISOString().split('T')[0],
            bs: NepaliFunctions.AD2BS(new Date(), 'YYYY-MM-DD', 'YYYY-MM-DD')
        };
    }

    static convert(date, direction) {
        try {
            const format = 'YYYY-MM-DD';
            return direction === 'toBS' 
                ? NepaliFunctions.AD2BS(date, format, format)
                : NepaliFunctions.BS2AD(date, format, format);
        } catch (error) {
            frappe.throw(__('Invalid date format'), __('Date Error'));
            return null;
        }
    }

    static validateFutureDate(source_date) {
        return frappe.datetime.compare_dates(source_date, this.today.ad) === 1;
    }
}

class DateFieldController {
    static PAIRS = [
        { bs: "date_bs", ad: "date_ad" },
        { bs: "received_letter_date_b_s", ad: "registered_documents_date_a_d" }
    ];

    static init(frm) {
        this.setup_date_pickers(frm);
        this.bind_events(frm);
    }

    static setup_date_pickers(frm) {
        this.PAIRS.forEach(pair => {
            frm.fields_dict[pair.bs].df.datepicker = {
                maxDate: NepaliDateManager.today.bs,
                maxDateAD: NepaliDateManager.today.ad
            };
            frm.fields_dict[pair.ad].df.datepicker = {
                maxDate: NepaliDateManager.today.ad
            };
        });
    }

    static bind_events(frm) {
        this.PAIRS.forEach(pair => {
            frm.fields_dict[pair.ad].df.onchange = () => 
                this.handle_conversion(frm, pair.ad, pair.bs, 'toBS');
            
            frm.fields_dict[pair.bs].df.onchange = () => 
                this.handle_conversion(frm, pair.bs, pair.ad, 'toAD');
        });
    }

    static handle_conversion(frm, source_field, target_field, direction) {
        const source_date = frm.doc[source_field]?.split(' ')[0];
        if (!source_date) return;

        if (NepaliDateManager.validateFutureDate(source_date)) {
            frappe.msgprint(__('Future dates are not allowed'));
            this.clear_fields(frm, [source_field, target_field]);
            return;
        }

        const converted_date = NepaliDateManager.convert(source_date, direction);
        converted_date ? 
            frm.set_value(target_field, converted_date) :
            this.clear_fields(frm, [source_field, target_field]);
    }

    static clear_fields(frm, fields) {
        fields.forEach(field => frm.set_value(field, ''));
    }
}