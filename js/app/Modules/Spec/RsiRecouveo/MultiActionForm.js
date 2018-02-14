Ext.define('Optima5.Modules.Spec.RsiRecouveo.MultiActionScenarioField',{
	extend: 'Ext.view.View',
	mixins: ['Ext.form.field.Field'],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			cls: 'op5-spec-rsiveo-actionsfield',
			style: {
				whiteSpace: 'nowrap'
			},
			tpl:[
				'<tpl for=".">',
					'<div class="op5-spec-rsiveo-actionthumb op5-spec-rsiveo-actionthumb-icon {thumb_class}">',
						'<div class="op5-spec-rsiveo-actionthumb-footer {footer_class}">',
						'{footer_text}',
						'</div>',
						'<div class="op5-spec-rsiveo-actionthumb-header {header_class}">',
						'{header_text}',
						'</div>',
					'</div>',
				'</tpl>'
			],
			trackOver: true,
			overItemCls: 'x-item-over',
			selectedItemCls: 'op5-spec-rsiveo-actionthumb-select',
			itemSelector: 'div.op5-spec-rsiveo-actionthumb',
			store: {
				model: 'RsiRecouveoScenarioLineModel',
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			prepareData: function(data) {
				var iconCls ;
				switch( data.link_action ) {
					case 'MAIL_OUT' :
						iconCls = 'op5-spec-rsiveo-action-mailout' ;
						break ;
					case 'CALL_OUT' :
						iconCls = 'op5-spec-rsiveo-action-callout' ;
						break ;
					case 'BUMP' :
						iconCls = 'op5-spec-rsiveo-action-bump' ;
						break ;
				}
				var footerClass ,
					footerText = '&#160;' ;
				if( data.is_selected ) {
					footerClass = 'op5-spec-rsiveo-actionthumb-footer-save' ;
				}
				Ext.apply(data, {
					thumb_class: iconCls,
					header_text: data.scenstep_tag,
					footer_class: footerClass,
					footer_text: footerText
				});
				return data;
			},
			listeners: {
				selectionchange: this.onSelectionChange,
				scope: this
			}
		}) ;
		me.callParent() ;
		me.mixins.field.constructor.call(me);
		
		me.doLoad() ;
	},
	doLoad: function(scenCode) {
		var params = {
			_moduleId: 'spec_rsi_recouveo',
			_action: 'file_getScenarioLine',
			force_scenCode: scenCode
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success ) {
					this.onLoadScenarioLine( Ext.JSON.decode(response.responseText).data ) ;
				}
			},
			scope: this
		}) ;
	},
	onLoadScenarioLine: function( scenarioData ) {
		this.getStore().loadData(scenarioData) ;
		this.setScrollable('horizontal') ;
	},
	setFirstSelection: function() {
		var store = this.getStore(),
			selModel = this.getSelectionModel() ;
		selModel.deselectAll() ;
	},
	onSelectionChange: function(selModel, records) {
		if( records.length == 1 ) {
			var selRecord = records[0],
				selNode = this.getNode(selRecord) ;
			this.setValue(selRecord) ;
		} else {
			this.setValue(null) ;
		}
	},
	isEqual: function(value1, value2) {
		return ( value1 === value2 );
	},
	setReadOnly: function(readOnly) {
		this.getSelectionModel().setLocked(readOnly) ;
	},
	getValueObject: function() {
		var data = {},
			selModel = this.getValue(),
			namePrefix = this.getName() ;
		if( selModel ) {
			data[namePrefix+'_'+'action'] = selModel.get('link_action') ;
			if( !Ext.isEmpty(selModel.get('scenstep_tag')) ) {
				data[namePrefix+'_'+'scenstep_code'] = selModel.get('scenstep_code') ;
				data[namePrefix+'_'+'scenstep_tag'] = selModel.get('scenstep_tag') ;
			}
		}
		return data ;
	},
	getModelData: function() {
		return this.getValueObject() ;
	},
	getSubmitData: function() {
		return this.getValueObject() ;
	}
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.MultiActionForm',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailInPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusAgreeFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusLitigFollowPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusClosePanel',
		
		'Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 400,
			height: 400,
			title: 'Action groupée sur dossiers',
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			fieldDefaults: {
				anchor: '100%',
				labelWidth: 85
			},
			items: [{
				xtype: 'radiogroup',
				fieldLabel: 'Action groupée',
				columns: 1,
				vertical: true,
				items: [
					{ boxLabel: 'Reprise dossier', name: 'multi_action', inputValue: 'bump' },
					{ boxLabel: 'Alignement scénario', name: 'multi_action', inputValue: 'scenstep'},
					{ boxLabel: 'Action externe / Litige', name: 'multi_action', inputValue: 'lock_litig' },
					{ boxLabel: 'Demande clôture', name: 'multi_action', inputValue: 'lock_close' },
					{ boxLabel: 'Assigner collaborateur', name: 'multi_action', inputValue: 'user' }
				],
				listeners: {
					change: function(rg,newValue,oldValue) {
						if( newValue.multi_action != oldValue.multi_action ) {
							this.setMultiMode( newValue.multi_action ) ;
						}
					},
					scope: this
				}
			},{
				xtype: 'fieldset',
				itemId: 'fsScenstep',
				title: 'Alignement scénario',
				items: [{
					xtype: 'combobox',
					name: 'scen_code',
					forceSelection:true,
					allowBlank:true,
					editable:true,
					typeAhead:false,
					queryMode: 'local',
					displayField: 'scen_txt',
					valueField: 'scen_code',
					minChars: 2,
					checkValueOnChange: function() {}, //HACK
					store: {
						autoLoad: true,
						model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigScenarioModel(),
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_rsi_recouveo',
								_action: 'config_getScenarios'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						})
					}
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.MultiActionScenarioField',{
					optimaModule: this.optimaModule,
					_fileRecord: this._fileRecord,
					_actionForm: this._actionForm,
					name: 'scenstep',
					listeners: {
						change: function(field,value) {
							//this.onScenStepChange(value);
						},
						scope: this
					}
				}),{
					hidden: true,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'next_date',
					fieldLabel: 'Date prévue'
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsLitig',
				padding: 10,
				title: 'Qualification litige',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 60
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_LITIG',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'litig_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				}),{
					anchor: '',
					width: 200,
					xtype: 'datefield',
					format: 'Y-m-d',
					name: 'litig_nextdate',
					fieldLabel: 'Prochain suivi'
				},{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'litig_ext_is_on',
					title: 'Affectation externe',
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						fieldLabel: 'Destinataire',
						name: 'litig_ext_user',
						cfgParam_id: 'USER',
						cfgParam_emptyDisplayText: 'Select...',
						icon: 'images/modules/rsiveo-users-16.png',
						selectMode: 'SINGLE',
						optimaModule: this.optimaModule
					})]
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsClose',
				padding: 10,
				title: 'Demande de clôture',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 60
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_CLOSEASK',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'close_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				})]
			},{
				xtype: 'fieldset',
				itemId: 'fsUser',
				padding: 10,
				title: 'Assignation collaborateur',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 95
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'USER',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'link_user',
					allowBlank: false,
					fieldLabel: 'Collaborateur'
				})]
			}],
			buttons: [{
				itemId: 'btnOk',
				hidden: false,
				xtype: 'button',
				text: 'OK',
				icon: 'images/modules/rsiveo-save-16.gif',
				handler: function( btn ) {
					this.handleSubmitEvent() ;
				},
				scope: this
			},{
				itemId: 'btnPreview',
				hidden: true,
				xtype: 'button',
				text: 'Preview',
				icon: 'images/modules/rsiveo-print-16.png',
				handler: function( btn ) {
					this.handlePreview() ;
				},
				scope: this
			}]
		}) ;
		this.callParent() ;
		this.getForm().setValues({litig_ext_is_on:false}) ;
		this.on('afterrender', function() {
			//this.startAction( this._arr_fileFilerecordIds ) ;
		},this) ;
		
		this.on('beforedestroy', this.onBeforeDestroy, this) ;
		
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
		this.setMultiMode(null) ;
	},
	
	setMultiMode: function(multiMode) {
		this.down('#fsScenstep').setVisible( multiMode=='scenstep' ) ;
		this.down('#fsClose').setVisible( multiMode=='lock_close' ) ;
		this.down('#fsLitig').setVisible( multiMode=='lock_litig' ) ;
		this.down('#fsUser').setVisible( multiMode=='user' ) ;
	},
	onFormChange: function(formP, field) {
		var form = formP.getForm() ;
		switch( field.getName() ) {
			case 'scen_code' :
				form.findField('scenstep').doLoad(field.getValue()) ;
				break ;
			case 'scenstep' :
				//console.dir(field.getValue()) ;
				break ;
		}
		this.updateLayout();
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	
	
	onBeforeDestroy: function() {
		var attachmentsField = this.getForm().findField('attachments') ;
		if( attachmentsField ) {
			attachmentsField.doDeleteAll() ;
		}
	}
}) ;
