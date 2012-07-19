Ext.define('Ext.ux.dams.ComboBoxCached',{
	extend : 'Ext.form.field.ComboBox',
			  
	alias : 'widget.comboboxcached',

	cachedValue: null,
			 
	initComponent:function() {
		var me = this ;
		
		me.callParent() ;
		me.store.on('datachanged',function(){
			me.onStoreLoadData() ;
		},me);
	},
			  
	setValue: function(value) {
		var me = this ;
		
		value = Ext.Array.from(value);
		if( value.length == 1 ) {
			var record = value[0];
			// record found, select it.
			if(record.isModel) {
				me.cachedValue = record.get(me.valueField) ;
			}
			else {
				me.cachedValue = record ;
			}
		}
		else if(value.length == 0 ) {
			me.cachedValue = null ;
		}
		
		me.callParent(arguments) ;
	},
	getValue: function() {
		var me = this ;
		return me.cachedValue ;
	},
	
	onStoreLoadData: function() {
		var me = this ;
		me.setValue( me.cachedValue ) ;
	}
}) ;