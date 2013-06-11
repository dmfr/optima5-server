Ext.define('Optima5.Modules.Admin.SdomainsForm' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: ['Ext.ux.dams.Icon48Picker'] ,
			 
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'card'
		});
		
		this.callParent() ;
		this.addEvents('saved') ;
		
		// console.dir( me.query('combobox') ) ;
	},
	
	calcLayout: function() {
		var me = this ;
		var formAttributes = me.getComponent('mFormAttributes') ;
		formAttributes.query('#overwrite_msg')[0].setVisible( !formAttributes.getForm().findField('overwrite_is_locked').getValue() );
	},
	
	loadRecord: function( adminSdomainRecord ) {
		var me = this ;
		if( adminSdomainRecord != null ) {
			me.isNew = false ;
			me.sdomainId = adminSdomainRecord.getId() ;
		} else {
			me.isNew = true ;
		}
		
		
		var modules = [] , key , val ;
		var op5modulesLib = Optima5.Helper.getModulesLib() ;
		Ext.Array.each(op5modulesLib.modulesGetAll() , function(m) {
			if( m.get('moduleType') != 'sdomain' ) {
				return ;
			}
			// console.dir(m) ;
			key = m.getId() ;
			val = m.get('moduleId') + ' :: ' + m.get('moduleName') ;
			modules.push([key,val]);
		}); 
		
		var icons = {} , key, val ;
		var op5iconsLib = Optima5.Helper.getIconsLib() ;
		Ext.Array.each(op5iconsLib.iconsGetAll() , function(i) {
			key = i.getId() ;
			val = op5iconsLib.iconGetCls48( i.getId() )  ;
			icons[key] = val ;
		}); 
		
		var formAttributes = Ext.create('Ext.form.Panel',{
			itemId:'mFormAttributes',
			border: false,
			frame:false,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			defaults: {
				//anchor: '100%'
			},
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelSeparator: ''
				//labelWidth: 125
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					me.saveRecord() ;
				},
				scope:me
			}],
			items:[{
				xtype:'textfield',
				name:'sdomain_id',
				fieldLabel:'Sdomain Code',
				width: 175,
				readOnly: me.isNew ? false : true,
				value: me.isNew ? null : adminSdomainRecord.get('sdomain_id')
			},{
				xtype: 'combobox',
				anchor:'100%',
				fieldLabel: 'Module Type',
				name: 'module_id',
				forceSelection: true,
				editable: false,
				store: modules,
				value: me.isNew ? null : adminSdomainRecord.get('module_id'),
				readOnly: !(me.isNew)
			},{
				xtype:'textfield',
				name:'sdomain_name',
				fieldLabel:'Sdomain Desc',
				anchor:'100%',
				value: me.isNew ? null : adminSdomainRecord.get('sdomain_name')
			},{
				xtype:'fieldset',
				title: 'Write protection',
				items:[{
					xtype:'checkboxfield',
					name:'overwrite_is_locked',
					fieldLabel:'Overwrite locked',
					inputValue:1,
					uncheckedValue:0,
					checked : me.isNew ? false : adminSdomainRecord.get('overwrite_is_locked')
				},{
					xtype:'component',
					itemId:'overwrite_msg',
					html:'Warning : open for restore/clone overwrite',
					style: 'color:#FF0000; font-weight:bold',
					padding: '0 0 5 10',
					hidden:true
				}]
			},{
				xtype:'damsicon48picker',
				store: icons,
				name:'icon_code',
				fieldLabel:'Desktop Icon',
				value: me.isNew ? null : adminSdomainRecord.get('icon_code')
			}]
		});
		formAttributes.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
			},me) ;
		},me) ;
		
		
		me.removeAll() ;
		me.add(formAttributes) ;
		me.calcLayout() ;
		//me.getLayout().setActiveItem(0) ;
	},
	saveRecord: function() {
		var me = this ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		var values = me.getComponent('mFormAttributes').getValues() ;
		if( me.isNew ) {
			values['_is_new'] = 1 ;
		} else {
			values['sdomain_id'] = me.sdomainId ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'sdomains_setSdomain'
			}),
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					if( Ext.decode(response.responseText).errors ) {
						me.getComponent('mFormAttributes').getForm().markInvalid(Ext.decode(response.responseText).errors) ;
					} else {
						Ext.Msg.alert('Failed', 'Save failed. Unknown error');
					}
				}
				else {
					me.fireEvent('saved') ;
				}
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
	},
	
	tool_checkModuleRunning: function() {
		var me = this ;
		// Check for sdomain open windows
		if( !me.isNew ) {
			var optimaApp = me.optimaModule.app ,
				runningInstance = null ;
			optimaApp.eachModuleInstance( function(moduleInstance) {
				if( moduleInstance.sdomainId != null && moduleInstance.sdomainId.toUpperCase() === me.sdomainId.toUpperCase() ) {
					runningInstance = moduleInstance ;
					return false ;
				}
			},me); 
			if( runningInstance != null ) {
				Ext.Msg.alert('Module running', 'Close all instances of '+me.sdomainId+' on desktop before applying changes');
				return true ;
			}
			return false ;
		}
	}
});