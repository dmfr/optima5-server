Ext.define('Optima5.Modules.CrmBase.AuthAndroidForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [] ,
			 
	layout: 'anchor',
	fieldDefaults: {
		labelAlign: 'left',
		labelWidth: 75
	},

			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:AuthAndroidForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			padding:10,
			title:'Device profile',
			defaults: {
				anchor: '100%'
			},
			items:[{
				xtype:'hiddenfield',
				name:'authandroid_id'
			},{
				xtype:'textfield',
				name:'device_android_id',
				fieldLabel:'Android ID',
				readOnly:true
			},{
				xtype:'checkboxfield',
				name:'device_is_allowed',
				fieldLabel:'Allowed',
				inputValue:1,
				uncheckedValue:0
			},{
				xtype:'textfield',
				name:'device_desc',
				fieldLabel:'Device desc.'
			},{
				xtype:'button',
				text:'Save profile',
				margin: "20 10 0 10",
				handler: function() {
					me.submitRecord() ;
				},
				scope:me
			}]
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
				me.fireEvent('change') ;
			},me) ;
		},me) ;
	},
	
	calcLayout: function() {
		
	},
			  
	submitRecord: function() {
		var me = this ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(me.getValues(),{
				_action: 'auth_android_setDevice'
			}),
			success : function() {
				me.fireEvent('saved') ;
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
	}
});