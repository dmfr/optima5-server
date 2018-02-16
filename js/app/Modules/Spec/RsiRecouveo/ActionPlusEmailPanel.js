Ext.define('Optima5.Modules.RsiRecouveo.EmailOutDestField',{
	extend: 'Ext.form.FieldContainer',
	
	mixins: [
		'Ext.form.field.Field'
	],

	_comboboxData: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				itemId: 'cmbAdd',
				xtype: 'combobox',
				width: 175,
				forceSelection: false,
				editable: true,
				queryMode: 'local',
				displayField: 'mail',
				valueField: 'mail',
				store: {
					data: this._comboboxData,
					fields: [{name:'nom', type:'string'}, {name: 'mail', type: 'string'}],

				},
				matchFieldWidth: false,
				listConfig: {
					width: 250,
					getInnerTpl: function(displayField) {
						return '<div style="padding-bottom:6px"><div>{nom}</div><div style="text:10px">Mail&#160;:&#160;{mail}</div></div>' ;
					}
				}
			},{
				itemId: 'btnAdd',
				xtype: 'button',
				iconCls: 'op5-spec-rsiveo-emailheadertags-btn',
				margin: {
					left: 4,
					right: 8
				},
				handler: function() {
					this.handleAdd() ;
				},
				scope: this
			},{
				itemId: 'dvTags',
				xtype: 'dataview',
				cls: 'op5-spec-rsiveo-emailheadertags-field',
				tpl: [
					'<tpl for=".">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-icodelete">',
							'</div>',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{tag}',
							'</div>',
						'</div>',
					'</tpl>'
				],
				itemSelector: 'div.op5-spec-rsiveo-emailheadertags',
				store: {
					data: [],
					fields: [{name:'mail', type:'string'}],

				},
				prepareData: function(data) {
					return data;
				},
				listeners: {
					itemclick: function(dv, record, item, index, e, eOpts) {
						if( e.getTarget('div.op5-spec-rsiveo-emailheadertags-icodelete') ) {
							this.deleteTag(record) ;
						}
					},
					scope: this
					
				}
			}]
		}) ;
		me.mixins.field.constructor.call(me);
		
		me.callParent() ;
	},
	getStore: function() {
		return this.down('#dvTags').getStore() ;
	},
	getRawValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return Ext.JSON.encode(values) ;
	},
	getValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return values ;
	},
	setRawValue: function(jsonValues) {
		if( Ext.isEmpty(jsonValues) ) {
			this.getStore().removeAll() ;
		}
		var values = Ext.JSON.decode( jsonValues ),
			data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	setValue: function(values) {
		if( Ext.isEmpty(values) ) {
			this.getStore().removeAll() ;
		}
		var data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	handleAdd: function() {
		var cmbAdd = this.down('#cmbAdd'),
			dvTags = this.down('#dvTags') ; 
		if( Ext.isEmpty(cmbAdd.getValue()) ) {
			return ;
		}

		var test = dvTags.getStore().findExact('tag',cmbAdd.getValue(),0);

		if (test == -1){
			dvTags.getStore().insert(0,{
			tag: cmbAdd.getValue().trim()
			});
			cmbAdd.reset() ;			
		}
		if( dvTags.getHeight() > this.getHeight() ) {
			this.setHeight(dvTags.getHeight()) ;
		}
		this.updateLayout() ;
	},
	deleteTag: function(tagRecord) {
		this.down('#dvTags').getStore().remove(tagRecord) ;
	}
});



Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel',{
	extend:'Ext.form.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldButton'],
	
	_fileRecord: null,
	
	initComponent: function() {
/*
		var lstMail = Ext.create('Ext.data.Store', {
			alias: 'store.mailListe',
			model: 'RsiRecouveoComboModel',
			data: [],
			autoload: true
		});
*/
		//	var voila = this._accountRecord.get('adrbook').get('adr_entity');
		var tableau = [];
		this._accountRecord.adrbook().each( function( adrbook ) {
			adrbook.adrbookentries().each( function(adrbookentries) {

				if (adrbookentries.get('adr_type') == 'EMAIL' && adrbookentries.get('status_is_invalid') == false){

					tableau.push({"nom": adrbook.get('adr_entity'), "mail": adrbookentries.get('adr_txt')});
					//emails.add({'nom': adrbook.get('adr_entity'), 'email' : adrbookentries.get('adr_txt')});
					
				}
				
			},this) ;
		},this) ;

		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{	
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 100
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Email sortant</b>'
				}]
			},{
				xtype: 'fieldset',
				itemId: 'fsAdrMail',
				title: 'Email',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'container',
					flex: 1,
					layout: 'anchor',
					defaults: {
						anchor: '100%',
						labelWidth: 100
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
						cfgParam_id: 'EMAIL',
						cfgParam_emptyDisplayText: 'Select...',
						optimaModule: this.optimaModule,
						name: 'email_from',
						allowBlank: false,
						fieldLabel: 'Expéditeur',
						anchor: '75%'
					}),
						Ext.create('Optima5.Modules.RsiRecouveo.EmailOutDestField', {
							_comboboxData: tableau,
							fieldLabel: 'Destinataire',
							name: 'email_to'
					}),
						Ext.create('Optima5.Modules.RsiRecouveo.EmailOutDestField', {
							_comboboxData: tableau,
							fieldLabel: 'Copie à',
							name: 'email_cc'
					}),{
						xtype: 'fieldcontainer',
						layout: 'hbox',
						fieldLabel: 'Objet',
						items: [{
							flex: 1, 
							xtype: 'textfield',
							name: 'email_subject'
						},{
							xtype: 'box',
							width: 16
						},{
							xtype: 'checkboxfield',
							boxLabel: 'Ajouter entête',
							value: true,
							name: 'email_outmodel_preprocess_banner'
						}]
					}]
				},{
					xtype: 'box',
					width: 16
				},	{
					xtype: 'container',
					width: 72,
					layout: {
						type: 'hbox',
						align: 'center'
					},
					items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldButton',{
						name: 'email_attachments',
						optimaModule: this.optimaModule,
						renderTarget: this._actionForm.getEl()
					})]
				}]
			},{
				xtype: 'htmleditor',
				enableColors: true,
				enableAlignements: true,
				name: 'email_body',
				height: 250
			}]
		}) ;
		
		this.callParent() ;
	},
	
	statics: {
		createEmailRecord: function(formValues) {
			
		}
	}

}) ;
