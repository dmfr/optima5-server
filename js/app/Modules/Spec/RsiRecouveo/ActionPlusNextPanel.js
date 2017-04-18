Ext.define('RsiRecouveoScenarioLineModel', {
	extend: 'RsiRecouveoConfigScenarioStepModel',
	fields: [
		{ name: 'is_before_skipped', type: 'boolean' },
		{ name: 'is_before_done', type: 'boolean' },
		{ name: 'is_current', type: 'boolean' },
		{ name: 'is_selected', type: 'boolean' },
		{ name: 'is_next', type: 'boolean' },
		{ name: 'is_next_auto', type: 'boolean' },
		{ name: 'status_is_ok', type: 'boolean' },
		{ name: 'date_sched', type:'date', dateFormat:'Y-m-d', allowNull:true},
		{ name: 'date_actual', type:'date', dateFormat:'Y-m-d', allowNull:true}
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextScenarioField',{
	extend: 'Ext.view.View',
	mixins: ['Ext.form.field.Field'],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			cls: 'op5-spec-rsiveo-actionsfield',
			overflowX: 'scroll',
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
				} else if( data.is_current ) {
					footerClass = 'op5-spec-rsiveo-actionthumb-footer-flag' ;
				} else if( data.is_before_done ) {
					footerClass = 'op5-spec-rsiveo-actionthumb-footer-done' ;
					footerText = Ext.Date.format(data.date_actual,'d/m/Y') ;
				} else if( data.is_before_skipped ) {
					footerClass = 'op5-spec-rsiveo-actionthumb-footer-skip' ;
				} else {
					footerClass = 'op5-spec-rsiveo-actionthumb-footer-wait' ;
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
	doLoad: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getScenarioLine',
				file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
				fileaction_filerecord_id: this._actionForm._fileActionFilerecordId
			},
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success ) {
					this.onLoadScenarioLine( Ext.JSON.decode(response.responseText).data ) ;
				}
			},
			scope: this
		}) ;
	},
	onLoadScenarioLine: function( scenarioData ) {
		this.setStyle({
			'overflow-x': 'scroll'
		}) ;
		
		this.getStore().loadData(scenarioData) ;
		this.setFirstSelection() ;
	},
	setFirstSelection: function() {
		var store = this.getStore(),
			selModel = this.getSelectionModel(),
			selectedRecord = store.findRecord('is_selected',true),
			nextRecord = store.findRecord('is_next',true) ;
		if( selectedRecord ) {
			selModel.select(selectedRecord) ;
		} else if( nextRecord ) {
			selModel.select(nextRecord) ;
		}
	},
	onSelectionChange: function(selModel, records) {
		Ext.Array.each( this.getNodes(), function(node) {
			Ext.fly(node).removeCls('op5-spec-rsiveo-actionthumb-red') ;
		}) ;
		if( records.length == 1 ) {
			var selRecord = records[0],
				selNode = this.getNode(selRecord) ;
			if( selRecord.get('is_before_skipped') || selRecord.get('is_before_done') ) {
				Ext.fly(selNode).removeCls('op5-spec-rsiveo-actionthumb-select').addCls('op5-spec-rsiveo-actionthumb-red') ;
			}
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
	},
	
	setValueNext: function() {
		var store = this.getStore(),
			selModel = this.getSelectionModel(),
			nextRecord = store.findRecord('is_next',true) ;
		if( nextRecord ) {
			selModel.select(nextRecord) ;
		} else {
			selModel.deselectAll() ;
		}
	},
	setValueNextAuto: function() {
		var store = this.getStore(),
			selModel = this.getSelectionModel(),
			nextRecord = store.findRecord('is_next_auto',true) ;
		if( nextRecord ) {
			selModel.select(nextRecord) ;
		} else {
			selModel.deselectAll() ;
		}
	}
});
Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel',{
	extend:'Ext.form.Panel',
	
	requires: [],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			height: 250,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'hbox',
				align: 'top'
			},
			items: [{
				xtype: 'fieldset',
				flex: 1,
				padding: 6,
				collapsed: false, // fieldset initially collapsed
				title: 'Prochaine action',
				layout: 'anchor',
				defaults: {
					anchor: '100%',
					labelWidth: 110
				},
				items:[{
					itemId: 'btnReset',
					anchor: '',
					xtype: 'button',
					icon: 'images/op5img/ico_wait_small.gif',
					text: 'Prochaine action...',
					style: 'margin-bottom: 6px',
					menu: [{
						icon: 'images/op5img/ico_arrow_right.gif',
						text: 'Prochaine action selon scénario',
						handler: function() {
							this.down('#scenarioField').setValueNext() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_arrow-double_16.png',
						text: 'Prochaine action automatique',
						handler: function() {
							this.down('#scenarioField').setValueNextAuto() ;
						},
						scope: this
					}],
					handler: function() {
						this.onFormBegin() ;
					},
					scope: this
				},{
					xtype: 'hiddenfield',
					name: 'next_fileaction_filerecord_id',
					value: 0
				},Ext.create('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextScenarioField',{
					itemId: 'scenarioField',
					optimaModule: this.optimaModule,
					_fileRecord: this._fileRecord,
					_actionForm: this._actionForm,
					name: 'next',
					listeners: {
						change: function(field,value) {
							this.onScenStepChange(value);
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
				xtype: 'box',
				width: 16
			}]
		}) ;
		
		this.callParent() ;
		this.getForm().getFields().each( function(field) {
			field.on('change',function(field) {
				this.onFormChange(this,field) ;
			},this) ;
		},this) ;
		this.onFormBegin() ;
	},
	onFormChange: function(form,field) {
		this.fireEvent('change',field) ;
	},
	onScenStepChange: function(scenStepRecord) {
		var fieldNextDate = this.getForm().findField('next_date') ;
		fieldNextDate.reset() ;
		fieldNextDate.setVisible( scenStepRecord && !Ext.isEmpty(scenStepRecord.get('scenstep_tag')) ) ;
		if( scenStepRecord && !Ext.isEmpty(scenStepRecord.get('date_sched')) ) {
			fieldNextDate.setValue(scenStepRecord.get('date_sched')) ;
		}
	},
	onFormBegin: function(form) {
		this.setRightPanel(null) ;
		
		var readOnly = this._fileRecord.statusIsSchedLock() ;
		this.getForm().getFields().each( function(field) {
			field.setReadOnly(readOnly) ;
		});
		this.down('#btnReset').setVisible(!readOnly) ;
	},
	setRightPanel: function(classname) {
		var oldPanel ;
		if( oldPanel = this.down('#cntRight') ) {
			this.remove(oldPanel) ;
		}
		if( Ext.isEmpty(classname) ) {
			this.add({
				xtype: 'box',
				itemId: 'cntRight',
				border: false,
				flex: 1
			});
			return ;
		} else {
			this.add(Ext.create(classname,{
				itemId: 'cntRight',
				flex: 1,
				border: false,
				
				optimaModule: this.optimaModule,
				_fileRecord: this._fileRecord,
				_actionForm: this._actionForm
			})) ;
		}
	}}) ;
