Ext.define('Optima5.Modules.Spec.DbsLam.StockAdrForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.CfgParamField',
		'Ext.ux.dams.FieldList'
	],
	
	initComponent: function() {
		var optimaModule = this.optimaModule ;
		
		var atrAdrFormFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( Ext.isEmpty(attribute.ADR_fieldcode) ) {
				return ;
			}
			var fieldToggle,
				fieldToggleKey = attribute.mkey+'_'+'toggle' ;
			atrAdrFormFields.push({
				xtype:'checkboxfield',
				name: fieldToggleKey,
				boxLabel: 'Modify : ' + attribute.atr_txt
			});
			
			var fieldEditor,
				fieldEditorKey = attribute.mkey+'_'+'value' ;
			if( attribute.bible_code ) {
				fieldEditor = {
					xtype:'op5crmbasebibletreepicker',
					selectMode: 'single',
					optimaModule: optimaModule,
					bibleId: attribute.bible_code
				} ;
			} else  {
				fieldEditor = {
					xtype:'textfield'
				} ;
			}
			Ext.apply(fieldEditor,{
				fieldLabel: attribute.atr_txt,
				name: fieldEditorKey
			}) ;
			atrAdrFormFields.push(fieldEditor) ;
		},this) ;
		
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			layout: 'anchor',
			fieldDefaults: {
				labelWidth:100,
				anchor:'100%'
			},
			items: [{
				xtype: 'damsfieldlist',
				name: 'adrs_list',
				fieldLabel: 'Locations'
			},{
				xtype: 'fieldset',
				title: 'Modify status',
				checkboxName: 'status_toggle',
				checkboxToggle: true,
				items: [{
					anchor: '',
					width: 220,
					xtype: 'combobox',
					name: 'status_is_active',
					fieldLabel: 'Status',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['id','txt'],
						data : [
							{id:'1', txt:'Active'},
							{id:'0', txt:'Disabled'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			},{
				xtype: 'fieldset',
				title: 'Modify container property',
				checkboxName: 'container_toggle',
				checkboxToggle: true,
				items: [{
					xtype:'checkboxfield',
					name: 'container_is_on',
					boxLabel: 'Mode container ?'
				},{
					xtype: 'combobox',
					name: 'container_type',
					fieldLabel: 'Container type',
					anchor: '100%',
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'container_type_txt',
					valueField: 'container_type',
					store: {
						model: 'DbsLamCfgContainerTypeModel',
						data: Ext.Array.merge([{
							container_type:' ',
							container_type_txt: '(No change)'
						}],Optima5.Modules.Spec.DbsLam.HelperCache.getContainerTypeAll()),
						proxy: {
							type: 'memory'
						}
					}
				},{
					anchor: '',
					width: 220,
					xtype: 'combobox',
					name: 'container_is_picking',
					fieldLabel: 'Picking access',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['id','txt'],
						data : [
							{id:' ', txt:'(No change)'},
							{id:'1', txt:'Picking'},
							{id:'0', txt:'Mass'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				}]
			},{
				xtype: 'fieldset',
				title: 'Modify location attributes',
				checkboxName: 'atr_toggle',
				checkboxToggle: true,
				items: atrAdrFormFields
			},{
				xtype: 'box',
				height: 16
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					pack: 'start'
				},
				items: [{
					xtype: 'button',
					scale: 'medium',
					icon: 'images/op5img/ico_procblue_16.gif',
					text: 'Submit',
					handler: function() {
						this.handleSubmit() ;
					},
					scope: this
				}]
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				if( !this.init_done ) {
					return ;
				}
				this.calcLayout() ;
				this.fireEvent('change') ;
			},this) ;
		},this) ;
		
		this.getForm().setValues({
			adrs_list: [],
			status_toggle: false,
			container_toggle: false,
			atr_toggle: false
		});
		
		if( this._cfg_arrAdrIds ) {
			this.init_arrAdrIds( this._cfg_arrAdrIds ) ;
		}
	},
	calcLayout: function() {
		var form = this.getForm() ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldToggle,
				fieldToggleKey = attribute.mkey+'_'+'toggle',
				fieldEditorKey = attribute.mkey+'_'+'value' ;
			var fieldToggle = form.findField(fieldToggleKey),
				fieldEditor = form.findField(fieldEditorKey);
			if( fieldToggle && fieldEditor ) {
				fieldEditor.setVisible( fieldToggle.getValue() ) ;
			}
		},this) ;
		
		var containerIsOn = form.findField('container_is_on').getValue() ;
		form.findField('container_type').setVisible( containerIsOn ) ;
		form.findField('container_is_picking').setVisible( containerIsOn ) ;
	},
	init_arrAdrIds: function( arrAdrIds ) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'stock_getGrid',
			filter_entryKey: Ext.JSON.encode(arrAdrIds)
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onInitLoad(ajaxResponse.data) ;
			},
			scope: this
		}) ;
	},
	onInitLoad: function( ajaxData ) {
		var adrListData = [] ;
		Ext.Array.each(ajaxData, function(row) {
			adrListData.push({
				id: row.adr_id,
				text: row.adr_id
			}) ;
		}) ;
		
		
		this.getForm().setValues({
			adrs_list: adrListData,
			status_toggle: false,
			container_toggle: false,
			container_type: ' ',
			container_is_picking: ' ',
			atr_toggle: false
		});
		this.calcLayout() ;
		this.init_done = true ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	handleSubmit: function() {
		this.fireEvent('saved') ;
		this.destroy() ;
	},
	
	dummyFn: Ext.emptyFn
	
	
});
