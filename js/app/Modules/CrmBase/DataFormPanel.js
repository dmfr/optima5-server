Ext.define('Optima5.Modules.CrmBase.DataFormPanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Optima5.Modules.CrmBase.DataFormPanelGmap',
		'Optima5.Modules.CrmBase.BiblePicker' ,
		'Ext.ux.form.field.ColorPickerCombo' ,
		'Ext.ux.form.field.DateTime' ,
		'Optima5.Modules.CrmBase.DataFormPanelGrid',
		'Optima5.Modules.CrmBase.DataFormPanelGallery',
		'Ext.ux.dams.FieldTree',
		'Ext.ux.dams.GMapPanel',
		'Ext.container.ButtonGroup',
		'Ext.layout.container.Table',
		'Ext.tab.Panel'
	],
			  
	transactionID: null,
	readOnly: false,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataFormPanel','No module reference ?') ;
		}
		if( !me.transactionID || !me.transactionDataType ) {
			Optima5.Helper.logError('CrmBase:DataFormPanel','No transaction ID ?') ;
		}
		
		Ext.apply(me,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				ui: 'footer',
				defaults: {minWidth: 100},
				items: [
					{ xtype: 'component', flex: 1 },
					{ xtype: 'button', text: 'Save' , handler:me.onSave, scope:me , hidden:me.readOnly },
					{ xtype: 'button', text: 'Cancel' , handler:me.onAbort , scope:me , hidden:me.readOnly },
					{ xtype: 'button', text: 'Close' , handler:me.onAbort , scope:me , hidden:!me.readOnly }
				]
			}]
		});
		
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action:'data_editTransaction',
				_subaction:'get_layout',
				_transaction_id : me.transactionID
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					this.addConfiguredComponents( Ext.decode(response.responseText).data ) ;
				}
			},
			scope: me
		});
		
		me.callParent() ;
	},
	
	addConfiguredComponents: function( layoutFromAjax ) {
		var me = this ;
		
		var formitems = new Array() ;
		Ext.Array.each( layoutFromAjax.form, function(v) {
			if( v.xtype=='op5crmbasebiblepicker' ) {
				Ext.apply(v,{optimaModule:me.optimaModule}) ;
			}
			if( v.xtype=='op5crmbasebibletreepicker' ) {
				Ext.apply(v,{optimaModule:me.optimaModule}) ;
			}
			if( v.xtype=='damsfieldtree' ) {
				Ext.apply(v,{width:300,autoHeight:true}) ;
			}
			if( v.xtype=='textfield' && v.strToUpper==true ) {
				Ext.apply(v,{
					listeners: {
						change: function(obj,newValue){
							obj.setRawValue(newValue.toUpperCase().replace(' ','_'));
						}
					}
				});
			}
			if( v.xtype=='checkboxfield' ) {
				Ext.apply(v,{
					checked:(v.value==v.inputValue)
				});
			}
			
			if( me.readOnly ) {
				v.readOnly = true ;
			}
			
			formitems.push( v );
		}) ;
		var formconfig = new Object();
		Ext.apply( formconfig, {
			xtype:'form',
			autoScroll: true,
			bodyPadding: 5,
			fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 100,
					anchor: '100%'
			},
			items: formitems
		});
		
		
		
		var tabitems = new Array() ;
		
		if( layoutFromAjax.gmap ) {
			var gmaptab = Ext.create('Optima5.Modules.CrmBase.DataFormPanelGmap',{
				title:'Adr/GMap',
				itemId:'gmap',
				optimaModule: me.optimaModule,
				transactionID : me.transactionID,
				readOnly: me.readOnly
			}) ;
			tabitems.push( gmaptab ) ;
		}
		
		//console.log('query?') ;
		if( layoutFromAjax.subfiles && layoutFromAjax.subfiles.length > 0 ) {
			//console.log('building some panels!!!') ;
			Ext.Array.each( layoutFromAjax.subfiles , function( cfgsubfile ) {
				//console.dir(cfgsubfile) ;
				switch( cfgsubfile.file_type ) {
					case 'media_img' :
						tabitems.push( this.buildSubfileGallery(cfgsubfile) ) ;
						break ;
					
					case 'grid' :
						tabitems.push( this.buildSubfilePanel(cfgsubfile) ) ;
						break ;
				}
			},this) ;
		}
		
		
		
		
		
		
		if( tabitems.length > 0 ) {
			var tabpanelcfg = new Object() ;
			Ext.apply(tabpanelcfg, {
				xtype:'tabpanel' ,
				flex: 1,
				//frame: true,
				activeTab: 0,
				defaults :{
						// bodyPadding: 10
				},
				items: tabitems
			}) ;
		}
		
		if( tabitems.length < 1 ) {
			Ext.apply( formconfig, {
				frame: true,
				flex: 1
			});
		}
		else {
			Ext.apply( formconfig, {
				flex: 0
			});
		}
		
		
		var thisitems = new Array() ;
		thisitems.push(formconfig) ;
		if( typeof(tabpanelcfg)!='undefined' ) {
			thisitems.push(tabpanelcfg) ;
		}
		
		this.add( thisitems ) ;
		//this.doLayout() ;
		this.loadEverything() ;
	},
	buildSubfilePanel: function( cfgsubfile ) {
		var me = this ;
		
		var columns = new Array() ;
		var colCfg = new Object() ;
		Ext.Array.each( cfgsubfile.columns, function(field) {
			colCfg = {
				flex: 1,
				dataIndex: field.code,
				sortable: false,
				text: field.lib,
				type: field.type
			} ;
			
			if( field.altdisplay && field.altdisplay != '' ) {
				Ext.apply( colCfg, {
					renderer: function(value,meta,record) {
						return record.get(field.altdisplay) ;
					}
				}) ;
			}

			switch( field.type ) {
				case '_label' :
					return ;
				
				case 'link' :
					switch( field.linktype ) {
						case 'treenode' :
							Ext.apply( colCfg, {
								flex:2,
								type: 'string',
								editor:{
									xtype:'op5crmbasebibletreepicker',
									optimaModule:me.optimaModule,
									bibleId: field.linkbible ,
									selectMode: 'single',
									allowBlank: !(field.is_header=='O' || field.is_mandatory=='O')
								}
							});
							break ;
							
						default :
							Ext.apply( colCfg, {
								flex:2,
								type: 'string',
								editor:{
									xtype:'op5crmbasebiblepicker',
									optimaModule:me.optimaModule,
									bibleId: field.linkbible ,
									allowBlank: !(field.is_header=='O' || field.is_mandatory=='O')
								}
							});
							break ;
					}
					break ;
					
				case 'date' :
					Ext.apply( colCfg, {
						editor:{ xtype:'datetimefield' , allowBlank: !(field.is_header=='O' || field.is_mandatory=='O') }
					});
					break ;
				
				case 'hidden' :
					Ext.apply( colCfg, {
						hidden:true
					});
					break ;
				
				default :
					Ext.apply( colCfg, {
						editor:{ xtype:'textfield', allowBlank: !(field.is_header=='O' || field.is_mandatory=='O') }
					});
					break ;
			}
			
			
			
			
			columns.push(colCfg) ;
		},me) ;
		
		
		
		var ajaxBaseParams = {} ;
		Ext.apply( ajaxBaseParams , this.ajaxBaseParams ) ;
		Ext.apply( ajaxBaseParams , {
			subfile_code: cfgsubfile.file_code
		}) ;
		
		var objCfg = {} ;
		Ext.apply( objCfg, {
			xtype:'op5crmbasedataformpanelgrid' ,
			optimaModule: me.optimaModule,
			transactionID : me.transactionID,
			title:cfgsubfile.file_lib,
			itemId: cfgsubfile.file_code,
			columns : columns,
			data:cfgsubfile.data,
			readOnly: me.readOnly
		}) ;
		return objCfg ;
	},
	buildSubfileGallery: function( cfgsubfile ) {
		var me = this ;
		
		var ajaxBaseParams = {} ;
		Ext.apply( ajaxBaseParams , this.ajaxBaseParams ) ;
		Ext.apply( ajaxBaseParams , {
			subfile_code: cfgsubfile.file_code
		}) ;
		
		var objCfg = {} ;
		Ext.apply( objCfg, {
			xtype:'op5crmbasedataformpanelgallery' ,
			optimaModule: me.optimaModule,
			transactionID : me.transactionID,
			title:cfgsubfile.file_lib,
			itemId: cfgsubfile.file_code,
			readOnly: me.readOnly
		}) ;
		return objCfg ;
	},
			  
			  
	loadEverything: function() {
		// data loaded inline while building form / subpanels
	},
			  
	
	onAbort: function(){
		this.destroy() ;
	},
	onSaveComponentCallback: function() {
		var me = this ;
		if( !me.nbComponentsSaved )
			me.nbComponentsSaved = 0 ;
		
		var nbToSave = 1 ;
		if( me.query('tabpanel').length > 0 ) {
			nbToSave += me.query('> tabpanel')[0].query('damsembeddedgrid').length ;
			nbToSave += (me.query('> tabpanel')[0].child('#gmap') != null) ? 1 : 0 ;
		}
		
		if( me.nbComponentsSaved >= nbToSave )
			return ;
		me.nbComponentsSaved = me.nbComponentsSaved + 1 ;
		if( me.nbComponentsSaved === nbToSave ) {
			me.fireEvent('allsaved',me.nbComponentsSaved) ;
		}
	},
	onSave: function() {
		var me = this ;
		
		if( !me.saveMask ) {
			me.saveMask = Ext.create('Ext.LoadMask',{
				msg:'Saving...',
				target:me
			});
		}
		me.query('>toolbar')[0].setDisabled(true) ;
		me.saveMask.show() ;
		
		
		me.nbComponentsSaved = 0 ;
		
		me.addEvents('allsaved') ;
		me.on('allsaved',function(nbSaved){
			// console.log('allsabed '+nbSaved) ;
			me.saveAndApply() ;
		},me) ;
		
		var params = {
			_action: 'data_editTransaction',
			_transaction_id: this.transactionID,
			_subaction:'form_setValues'
		};
		Ext.apply(params,this.query('form')[0].getForm().getValues()) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:params,
			success : me.onSaveComponentCallback,
			failure: function(form,action){
				me.query('>toolbar')[0].setDisabled(false) ;
				if( me.saveMask )
					me.saveMask.hide() ;
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
		if( me.query('tabpanel').length > 0 ) {
			Ext.Array.each( me.query('tabpanel')[0].query('damsembeddedgrid'), function(item) {
				var params = {
					_action: 'data_editTransaction',
					_transaction_id: me.transactionID,
					_subaction: 'subfileData_set',
					subfile_code: item.itemId
				};
				params['data'] = Ext.encode(item.getData()) ;
				
				me.optimaModule.getConfiguredAjaxConnection().request({
					params:params,
					success: me.onSaveComponentCallback,
					scope:me
				}) ;
			},me) ;
			
			if( me.query('> tabpanel')[0].child('#gmap') != null ) {
				me.query('> tabpanel')[0].child('#gmap').save(me.onSaveComponentCallback,me) ;
			}
		}
	},
	saveAndApply: function() {
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_editTransaction',
				_transaction_id: me.transactionID,
				_subaction : 'save_and_apply'
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					me.query('>toolbar')[0].setDisabled(false) ;
					if( me.saveMask )
						me.saveMask.hide() ;
					
					if( Ext.decode(response.responseText).errors ) {
						this.query('form')[0].getForm().markInvalid(Ext.decode(response.responseText).errors) ;
					} else {
						var msg = Ext.decode(response.responseText).msg ;
						if( msg != null ) {
							Ext.Msg.alert('Failed', msg);
						} else {
							Ext.Msg.alert('Failed', 'Save failed. Unknown error');
						}
					}
				}
				else {
					this.optimaModule.postCrmEvent('datachange',{
						dataType: me.transactionDataType,
						bibleId: me.transactionBibleId,
						fileId: me.transactionFileId
					});
					this.destroy() ;
				}
			},
			scope: this
		});
	}
	
});