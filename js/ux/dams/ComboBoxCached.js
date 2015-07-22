Ext.define('Ext.ux.dams.ComboBoxCached',{
	extend : 'Ext.form.field.ComboBox',
			  
	alias : 'widget.comboboxcached',
	
	doSetValue: function(value,add) {
		var me = this ,
			store = me.getStore(),
			displayIsValue = me.displayField === me.valueField ;
		if( !Ext.isEmpty(value) && store.getCount() == 0 ) {
			if (!value.isModel) {
				if (add) {
					me.value = Ext.Array.from(me.value).concat(value);
				} else {
					me.value = value;
				}

				me.setHiddenValue(me.value);

				// If we know that the display value is the same as the value, then show it.
				// A store load is still scheduled so that the matching record can be published.
				me.setRawValue(displayIsValue ? value : '');
			}
			return me ;
		}
		this.callParent(arguments) ;
	},
	onDataChanged: function(store) {
		this.callParent() ;
		this.onLoad(store,[],true) ;
	}
}) ;