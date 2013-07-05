Ext.define('Optima5.Modules.Admin.SdomainsForm' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: ['Ext.ux.dams.Icon48Picker','Optima5.Modules.Admin.CardHeader'] ,
			 
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'card'
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		me.on('destroy',function() {
			if( me.loadMask ) {
				me.loadMask.destroy()
			}
		},me) ;
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
			},{
				iconCls:'op5-sdomains-menu-actions',
				text:'Actions',
				hidden: me.isNew,
				menu:[{
					iconCls:'op5-sdomains-menu-export',
					text:'Export / Dump',
					hidden : me.isNew,
					handler: function() {
						me.getLayout().setActiveItem('mCardExport') ;
					},
					scope:me
				},{
					iconCls:'op5-sdomains-menu-import',
					text:'Import (overwrite)',
					hidden : me.isNew || adminSdomainRecord.get('overwrite_is_locked'),
					handler: function() {
						me.getLayout().setActiveItem('mCardImport') ;
					},
					scope:me
				},{
					iconCls:'op5-sdomains-menu-delete',
					text:'Delete',
					hidden : me.isNew || adminSdomainRecord.get('overwrite_is_locked'),
					handler: function() {
						me.getLayout().setActiveItem('mCardDelete') ;
					},
					scope:me
				}]
			}],
			items:[{
				xtype:'textfield',
				name:'sdomain_id',
				fieldLabel:'Sdomain Code',
				width: 175,
				readOnly: me.isNew ? false : true,
				value: me.isNew ? null : adminSdomainRecord.get('sdomain_id_forDisplay')
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
		
		
		var cardExport = Ext.create('Ext.panel.Panel',{
			itemId:'mCardExport',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-export',
					title: 'Export Sdomain',
					caption: 'Download sdomain as OP5 data file'
				}
			}),{
				xtype:'container',
				padding: "24 0 0 0",
				items:[{
					xtype: 'button',
					padding: '0 16px',
					scale: 'large',
					text: 'Download',
					handler: null
				}]
			},{
			}]
		}) ;
		
		var cardImport = Ext.create('Ext.panel.Panel',{
			itemId:'mCardImport',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-import',
					title: 'Import Sdomain',
					caption: 'Overwrite sdomain from OP5 data (file/remote)'
				}
			}),{
				xtype:'form',
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "8 0 0 0",
				width:'100%',
				layout:'anchor',
				items:[{
					xtype: 'fieldset',
					title: 'From local file',
					items:[{
						xtype: 'filefield',
						anchor:'100%',
						emptyText: 'Select local OP5 file',
						name: 'op5-filename',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						}
					},{
						xtype:'container',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Ok',
							handler: null
						}]
					}]
				}]
			},{
				xtype:'form',
				border: false,
				frame:false,
				bodyCls: 'ux-noframe-bg',
				padding: "0 0 0 0",
				width:'100%',
				layout:'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelSeparator: '',
					labelWidth: 90
				},
				items:[{
					xtype: 'fieldset',
					title: 'From remote source',
					items:[{
						xtype: 'textfield',
						anchor:'100%',
						emptyText: 'Server URL',
						fieldLabel: 'Server URL',
						name: 'fetch_url'
					},{
						xtype: 'textfield',
						width:'100',
						emptyText: 'Login domain',
						fieldLabel: 'Domain',
						name: 'fetch_login_domain'
					},{
						xtype:'fieldcontainer',
						anchor:'100%',
						fieldLabel:'Administrator',
						layout:'hbox',
						items:[{
							xtype: 'textfield',
							flex:1,
							emptyText: 'Username',
							name: 'fetch_login_user'
						},{
							xtype:'splitter'
						},{
							xtype: 'textfield',
							flex:1,
							emptyText: 'Password',
							name: 'fetch_login_pass',
							inputType: 'password'
						}]
					},{
						xtype:'container',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Search',
							handler: null
						}],
						hidden:false
					},{
						xtype: 'textfield',
						width:'100',
						emptyText: 'Src Sdomain',
						fieldLabel: 'Src Sdomain',
						name: 'fetch_src_sdomain',
						hidden:true
					},{
						xtype:'container',
						width:'100%',
						style:{textAlign:'right'},
						padding: "0 6px 6px 0",
						items:[{
							xtype: 'button',
							padding: '0 16px',
							scale: 'small',
							text: 'Ok',
							handler: null
						}],
						hidden:true
					}]
				}]
			}]
		}) ;
		
		var cardDelete = Ext.create('Ext.panel.Panel',{
			itemId:'mCardDelete',
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'center'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-back',
				text:'Back',
				handler: function() {
					me.getLayout().setActiveItem('mFormAttributes') ;
				},
				scope:me
			}],
			items:[Ext.create('Optima5.Modules.Admin.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-delete',
					title: 'Delete Sdomain',
					caption: 'Permanently delete all associated data'
				}
			}),{
				xtype:'container',
				itemId:'pCheckContainer',
				padding: "24 0 8 0",
				layout:'hbox',
				items:[{
					xtype:'checkbox',
					itemId:'pCheckbox'
				},{
					xtype:'component',
					style:{color:'#CC0000',fontWeight:'bold'},
					html:'Confirm deletion of current sdomain',
					padding:'2px 6px'
				}]
			},{
				xtype: 'button',
				padding: '0 16px',
				scale: 'large',
				text: 'Delete',
				handler: function( btn ) {
					if( btn.up('panel').getComponent('pCheckContainer').getComponent('pCheckbox').getValue() ) {
						me.doDelete();
					}
				},
				scope:me
			}]
		}) ;
		
		
		me.removeAll() ;
		me.add(formAttributes) ;
		me.add(cardExport) ;
		me.add(cardImport) ;
		me.add(cardDelete) ;
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
		
		me.loadMask = new Ext.LoadMask(me.getComponent('mFormAttributes'), {msg:'Saving...'});
		me.loadMask.show() ;
		
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
			callback: function() {
				me.loadMask.destroy() ;
			},
			success : function(response) {
				var responseObj = Ext.decode(response.responseText) ;
				if( responseObj.success == false ) {
					if( responseObj.errors ) {
						me.getComponent('mFormAttributes').getForm().markInvalid(responseObj.errors) ;
					}
					if( responseObj.msg != null ) {
						Ext.Msg.alert('Failed', responseObj.msg);
					}
				}
				else {
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: values.sdomain_id
					}) ;
				}
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
	},
	doDelete:function(){
		var me = this ;
		
		if( !me.isNew ) {
			if( me.tool_checkModuleRunning() ) {
				return ;
			}
		}
		
		me.loadMask = new Ext.LoadMask(me.getComponent('mCardDelete'), {msg:'Deleting...'});
		me.loadMask.show() ;
		
		var values = {sdomain_id:me.sdomainId} ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'sdomains_deleteSdomain'
			}),
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Delete failed. Unknown error');
				}
				else {
					me.optimaModule.postCrmEvent('sdomainchange',{
						sdomainId: values.sdomain_id
					}) ;
				}
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