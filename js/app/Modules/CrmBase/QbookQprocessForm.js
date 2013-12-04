Ext.define('Optima5.Modules.CrmBase.QbookQprocessForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [] ,
			 
	layout: 'anchor',
	fieldDefaults: {
		labelAlign: 'left',
		labelWidth: 75
	},
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			defaults: {
				anchor: '100%'
			},
			tbar:[{
				text: 'Empty',
				iconCls: 'icon-bible-delete',
				handler: function() {
					this.getForm().reset() ;
				},
				scope: this
			}],
		});
		
		this.callParent() ;
		
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
				me.fireEvent('change') ;
			},me) ;
		},me) ;
	},
	
	comboboxGetStoreCfg: function() {
		var data = [] ;
		Ext.Array.each( this.inputvarRecords, function(inputvarRecord) {
			if( this.inputvarFieldType != null 
				&& this.inputvarFieldType != '' 
				&& inputvarRecord.get('inputvar_type') != this.inputvarFieldType ) {
				
				return ;
			}
			if( this.inputvarFieldLinkbible != null 
				&& this.inputvarFieldLinkbible != '' 
				&& inputvarRecord.get('inputvar_linkbible') != this.inputvarFieldLinkbible ) {
				
				return ;
			}
			
			var obj = {} ;
			obj[this.comboboxGetStoreValueField()] = inputvarRecord.getId() ;
			obj[this.comboboxGetStoreDisplayField()] = inputvarRecord.get('inputvar_lib') ;
			data.push(obj) ;
		},this) ;
		
		return {
			fields: [this.comboboxGetStoreDisplayField(),this.comboboxGetStoreValueField()],
			data : data
		} ;
	},
	comboboxGetStoreValueField: function() {
		return 'field_text' ;
	},
	comboboxGetStoreDisplayField: function() {
		return 'field_code' ;
	},
	
	calcLayout: function() {
		
	}
			  
});
