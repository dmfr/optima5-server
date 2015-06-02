Ext.define('WbMrfoxyFinanceCfgCropModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'crop_year',
    fields: [
        {name: 'crop_year', type: 'string'},
        {name: 'date_apply', type: 'string'},
		  {name: 'is_current', type: 'boolean'},
		  {name: 'is_preview', type: 'boolean'}
    ]
}) ;

Ext.define('WbMrfoxyFinanceCfgCurrencyModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'currency_code',
    fields: [
        {name: 'currency_code', type: 'string'},
        {name: 'currency_sign', type: 'string'},
		  {name: 'currency_text', type: 'string'},
		  {name: 'eq_USD', type: 'number'}
    ]
}) ;

Ext.define('WbMrfoxyFinanceCfgProdtagModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'prodtag',
    fields: [
        {name: 'prodtag', type: 'string'},
        {name: 'prodtag_txt', type: 'string'}
    ]
}) ;

/* Unused model */
Ext.define('WbMrfoxyFinanceGridGroupRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'row_key', type: 'string'},
		{name: 'row_text', type: 'string'},
		{name: 'row_sub_prodtag', type: 'string'},
		{name: 'row_sub_txt', type: 'string'},
		{name: 'value_obj', type: 'string'},
		{name: 'value', type: 'number'}
	]
}) ;
Ext.define('WbMrfoxyFinanceGridGroupModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'group_key', type: 'string'},
		{name: 'group_text', type: 'string'},
		{name: 'operation', type: 'string'},
		{name: 'has_total', type: 'boolean'},
		{name: 'has_sub_txt', type: 'boolean'}
	],
	hasMany: [{
		model: 'WbMrfoxyFinanceGridGroupRowModel',
		name: 'rows',
		associationKey: 'rows'
	}]
}) ;

/* Unused model */
Ext.define('WbMrfoxyFinanceGridRevisionRowModel', {
	extend: 'Ext.data.Model',
	fields: []
}) ;
Ext.define('WbMrfoxyFinanceGridRevisionModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'filerecord_id', type: 'int'},
		{name: 'revision_id', type: 'string'},
		{name: 'is_crop_initial', type: 'string'},
		{name: 'revision_date', type: 'string'},
		{name: 'is_actual', type: 'boolean'},
		{name: 'is_editing', type: 'boolean'}
	],
	hasMany: [{
		model: 'WbMrfoxyFinanceGridRevisionRowModel',
		name: 'rows',
		associationKey: 'rows'
	}]
}) ;


Ext.define('Optima5.Modules.Spec.WbMrfoxy.WbMrfoxyFinanceRevisionRowValueField', {
	extend:'Ext.form.FieldContainer',
	mixins: {
		field: 'Ext.form.field.Field'
	},
	layout: 'hbox',
	combineErrors: true,
	msgTarget :'side',
	allowBlank: true,

	displayCurrency: null,
	
	fieldAmount: null,
	fieldAmountLegend: null,
	fieldPercent: null,
	fieldPercentLegend: null,
	
	isFormField: true,
	submitValue: true,
	
	currencySign: null,

	initComponent: function() {
		var me = this;
		me.buildField();
		me.callParent();
		
		var queryCmps = this.query() ;
		this.fieldMode = queryCmps[0];
		this.fieldModeSpacer = queryCmps[1] ;
		this.fieldPercent = queryCmps[2];
		this.fieldPercentLegend = queryCmps[3];
		this.fieldAmount = queryCmps[4];
		this.fieldAmountLegend = queryCmps[5];
		
		me.mon( this.fieldMode, 'change', me.onSubfieldChange, me ) ;
		me.mon( this.fieldAmount, 'change', me.onSubfieldChange, me ) ;
		me.mon( this.fieldPercent, 'change', me.onSubfieldChange, me ) ;
		
		me.initField();
		if( me.currencySign != null ) {
			me.setCurrencySign(me.currencySign) ;
		}
		me.fieldPercentLegend.update('&#160;%&#160;of&#160;') ;
	},
	
	//@private
	buildField: function(){
		this.items = [{
			xtype: 'combobox',
			width: 75,
			isFormField: true,
			forceSelection:true,
			editable:false,
			queryMode: 'local',
			displayField: 'txt',
			valueField: 'id',
			store: {
				fields: ['id','txt'],
				data: [
					{id: '', txt:'-select-'},
					{id: 'static', txt:'Fix.Cost'},
					{id: 'percent', txt:'% of Rev'}
				]
			},
			matchFieldWidth:false,
			listConfig: {width:200}
		},{
			xtype: 'box',
			width: 16,
			html:'&#160;'
		},{
			xtype: 'numberfield',
			isFormField: true,
			width: 35,
			hideTrigger:true
		},{
			xtype: 'box',
			width: 35,
			html:'&#160;'
		},{
			xtype: 'numberfield',
			isFormField: true,
			width: 60,
			hideTrigger:true
		},{
			xtype: 'box',
			width: 16,
			html:'&#160;'
		}]
	},
	doFieldsLayout: function() {
		switch( this.fieldMode.getValue() ) {
			case 'static' :
				this.fieldAmount.setVisible(true) ;
				this.fieldAmountLegend.setVisible(true) ;
				this.fieldPercent.setVisible(false) ;
				this.fieldPercentLegend.setVisible(false) ;
				break ;
			case 'percent' :
				this.fieldAmount.setVisible(true) ;
				this.fieldAmountLegend.setVisible(true) ;
				this.fieldPercent.setVisible(true) ;
				this.fieldPercentLegend.setVisible(true) ;
				break ;
			default :
				this.fieldAmount.setVisible(false) ;
				this.fieldAmountLegend.setVisible(false) ;
				this.fieldPercent.setVisible(false) ;
				this.fieldPercentLegend.setVisible(false) ;
				break ;
		}
	},
	
	setCurrencySign: function( sign ) {
		this.fieldAmountLegend.update('&#160;' + sign) ;
	},
	
	onSubfieldChange: function(field) {
		if( field == this.fieldMode ) {
			this.doFieldsLayout() ;
		}
		this.checkChange() ;
	},
	
	getErrors: function() {
		return Ext.Object.getValues( this.getErrorsObj() ) ;
	},
	getErrorsObj: function() {
		var me = this ,
		allowBlank = false ;
		
		var errors = {} ;
		if( !allowBlank ) {
			if( Ext.isEmpty( this.fieldMode.getValue() ) ) {
				return {fieldMode: 'Select mode'} ;
			}
			switch( this.fieldMode.getValue() ) {
				case 'percent' :
					if( Ext.isEmpty( this.fieldPercent.getValue() ) ) {
						Ext.apply(errors, {fieldPercent: 'Specify percentage'}) ;
					}
					if( Ext.isEmpty( this.fieldAmount.getValue() ) ) {
						Ext.apply(errors, {fieldAmount: 'Specify budgeted revenue'}) ;
					}
					break ;
				case 'static' :
					if( Ext.isEmpty( this.fieldAmount.getValue() ) ) {
						Ext.apply(errors, {fieldAmount: 'Specify amount'}) ;
					}
					break ;
			}
		}
		return errors ;
	},
	isValid : function() {
		var me = this,
				disabled = me.disabled,
				validate = me.forceValidation || !disabled;
		return validate ? me.validateValue() : disabled;
	},
	validateValue: function() {
		var me = this,
				errors = me.getErrors(),
				isValid = Ext.isEmpty(errors);
		if (!me.preventMark) {
			if (isValid) {
				me.clearInvalid();
			} else {
				me.markInvalid(me.getErrorsObj());
			}
		}

		return isValid;
	},
	markInvalid: function(errors) {
		if( errors['fieldMode'] && this.fieldMode ) {
			this.fieldMode.markInvalid([errors['fieldMode']]) ;
		}
		if( errors['fieldAmount'] && this.fieldAmount ) {
			this.fieldAmount.markInvalid([errors['fieldAmount']]) ;
		}
		if( errors['fieldPercent'] && this.fieldPercent ) {
			this.fieldPercent.markInvalid([errors['fieldPercent']]) ;
		}
	},
	clearInvalid: function() {
		if( this.fieldMode ) {
			this.fieldMode.clearInvalid() ;
		}
		if( this.fieldAmount ) {
			this.fieldAmount.clearInvalid() ;
		}
		if( this.fieldPercent ) {
			this.fieldPercent.clearInvalid() ;
		}
	},
	 
	getValue: function() {
		var valueObj = {
			mode: this.fieldMode.getValue(),
			amount: this.fieldAmount.getValue(),
			percent: this.fieldPercent.getValue()
		};
		var valueJson = Ext.JSON.encode(valueObj) ;
		return valueJson ;
	},
	setValue: function( jsonValue ) {
		if( Ext.isEmpty(jsonValue) ) {
			this.fieldMode.setValue(null);
			this.fieldAmount.setValue(null);
			this.fieldPercent.setValue(null);
			this.doFieldsLayout() ;
			return ;
		}
		
		var valueObj = Ext.JSON.decode(jsonValue) ;
		this.fieldMode.setValue(valueObj.mode);
		this.fieldAmount.setValue(valueObj.amount);
		this.fieldPercent.setValue(valueObj.percent);
		this.doFieldsLayout() ;
		this.checkChange() ;
	}
});


Ext.define('Optima5.Modules.Spec.WbMrfoxy.FinanceBudgetPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function(){
		Ext.apply(this,{
			//frame: true,
			border: false,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCountry',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbCountrySelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'country_code', type: 'string'},
								{name: 'country_text', type: 'string'},
								{name: 'country_iconurl', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'country_text',
						rootVisible: true,
						useArrows: true
					}]
				}
			},{
				itemId: 'tbCropYear',
				iconCls: 'op5-crmbase-datatoolbar-view-calendar',
				baseText: 'Crop selection',
				menu: {
					listeners: {
						click: function(menu, item) {
							if( item && item.cropYear != null && (menu.ownerButton) instanceof Ext.button.Button ) {
								menu.ownerButton.cropYear = item.cropYear ;
								this.onSelectCropYear() ;
							}
						},
						scope: this
					},
					items:[]
				},
				listeners: {
					render: function(button) {
						if( button.cropYear == null ) {
							button.setText( button.baseText ) ;
						}
					}
				}
			},{
				itemId: 'tbCurrency',
				iconCls: 'op5-spec-mrfoxy-financebudget-currency',
				baseText: 'Currency',
				hidden: true,
				menu: {
					listeners: {
						click: function(menu, item) {
							if( item && item.currencyCode != null && (menu.ownerButton) instanceof Ext.button.Button ) {
								menu.ownerButton.currencyCode = item.currencyCode ;
								this.onSelectCurrency() ;
							}
						},
						scope: this
					},
					items:[]
				},
				listeners: {
					render: function(button) {
						if( button.currencyCode == null ) {
							button.setText( button.baseText ) ;
						}
					}
				}
			},'->',{
				itemId: 'tbNewBegin',
				icon: 'images/op5img/ico_new_16.gif',
				text: 'New revision...' ,
				handler: this.handleNewRevision,
				scope: this
			},{
				itemId: 'tbNewEnd',
				icon: 'images/op5img/ico_new_16.gif',
				text: 'New revision' ,
				cls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu',
				disabled: true
			},{
				itemId: 'tbExport',
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Download' ,
				menu: [{
					icon: 'images/op5img/ico_save_16.gif',
					text: 'Current config as XLS' ,
					handler: this.handleDownloadCfg,
					scope: this
				},{
					icon: 'images/modules/crmbase-chart-bar-16.png',
					text: 'Promo Budget dashboard' ,
					handler: this.handleDownloadDashboard,
					scope: this
				}]
			}],
			items:[{
				xtype:'box',
				cls:'ux-noframe-bg',
				itemId:'init'
			}],
			listeners: {
				tbarselect: this.onTbarSelect,
				scope: this
			}
		});
		
		this.tmpModelName = 'FinanceBudgetGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.callParent() ;
		this.updateToolbar() ;
		this.loadComponents() ;
	},
	loadComponents: function() {
		var me = this,
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		countryChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.WbMrfoxy.HelperCache.countryGetAll(), function(rec) {
			countryChildren.push({
				leaf:true,
				checked: false,
				country_code: rec.get('country_code'),
				country_text: rec.get('country_display'),
				country_iconurl: rec.get('country_iconurl'),
				icon: rec.get('country_iconurl')
			});
		}, me) ;
		tbCountrySelect.setRootNode({
			root: true,
			children: countryChildren,
			expanded: true,
			country_code:'',
			country_text:'<b>'+'All countries'+'</b>',
			country_iconurl:'images/op5img/ico_planet_small.gif',
			checked:true,
			icon: 'images/op5img/ico_planet_small.gif'
		});
		tbCountrySelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectCountry() ;
			}
		},this) ;
		this.onSelectCountry(true) ;
		
		
		
		// Load crop years => server
		this.storeCfgCrop = Ext.create('Ext.data.Store',{
			model: 'WbMrfoxyFinanceCfgCropModel',
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'finance_getCfgCrop'
				},
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			}),
			listeners: {
				load: this.loadComponentsOnStoreCropLoad,
				scope: this
			}
		}) ;
		
		
		// Load crop years => server
		this.storeCurrency = Ext.create('Ext.data.Store',{
			model: 'WbMrfoxyFinanceCfgCurrencyModel',
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'finance_getCfgCurrency'
				},
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			}),
			listeners: {
				load: this.loadComponentsOnStoreCurrencyLoad,
				scope: this
			}
		}) ;
		
		
		// Load crop years => server
		this.storeProdtag = Ext.create('Ext.data.Store',{
			model: 'WbMrfoxyFinanceCfgProdtagModel',
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'finance_getCfgProdtag'
				},
				reader: {
					type: 'json',
					rootProperty: 'data'
				}
			})
		}) ;
	},
	loadComponentsOnStoreCropLoad: function( storeCfgCrop ) {
		var menuitems = [],
			currentCropYear ;
		Ext.Array.each( storeCfgCrop.getRange(), function(cropRecord) {
			var cropData = cropRecord.data ;
			var key = cropData.crop_year ;
			var text = cropData.crop_year ;
			if( cropData.is_preview ) {
				text+= ' ' + '(<i>preview</i>)' ;
			} else if( cropData.is_current ) {
				text+= ' ' + '(<b>current</b>)' ;
				currentCropYear = cropData.crop_year ;
			}
			menuitems.push({
				text: text,
				cropYear: key
			}) ;
		}) ;
		this.down('#tbCropYear').menu.removeAll() ;
		this.down('#tbCropYear').menu.add( menuitems ) ;
		
		if( currentCropYear != null ) {
			this.down('#tbCropYear').cropYear = currentCropYear ;
			this.onSelectCropYear() ;
		}
	},
	loadComponentsOnStoreCurrencyLoad: function( storeCfgCurrency ) {
		var menuitems = [],
			currentCurrency ;
		Ext.Array.each( storeCfgCurrency.getRange(), function(currencyRecord) {
			var currencyData = currencyRecord.data ;
			var key = currencyData.currency_code ;
			var text = '<b>' + currencyData.currency_sign + '</b>' + ' / ' + currencyData.currency_code ;
			menuitems.push({
				text: text,
				currencyCode: key
			}) ;
		}) ;
		this.down('#tbCurrency').menu.removeAll() ;
		this.down('#tbCurrency').menu.add( menuitems ) ;
	},
	
	onSelectCountry: function(silent) {
		var me = this,
			tbCountry = this.query('#tbCountry')[0],
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		tbCountrySelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				tbCountry.setIcon( chrec.get('country_iconurl') ) ;
				tbCountry.setText( chrec.get('country_text') ) ;
				
				me.filterCountry = chrec.get('country_code') ;
				if( !silent ) {
					me.fireEvent('tbarselect') ;
				}
				
				return false ;
			}
		},this);
	},
	onSelectCropYear: function(silent) {
		var me = this ;
			tbCropYear = this.query('#tbCropYear')[0] ;
			
		me.filterCropYear = tbCropYear.cropYear ;
		tbCropYear.setText( tbCropYear.baseText + (tbCropYear.cropYear ? ' '+'(<b>'+tbCropYear.cropYear+'</b>)' : '') ) ;
		if( !silent ) {
			me.fireEvent('tbarselect') ;
		}
	},
	onSelectCurrency: function(silent) {
		var tbCurrency = this.query('#tbCurrency')[0],
			ajaxData = this.ajaxData ;
		if( !ajaxData ) {
			this.convertCurrency = null ;
			this.updateToolbar() ;
			return ;
		}
		var nativeCurrency = ajaxData.params.currency_code,
			selectCurrency = tbCurrency.currencyCode ;
		if( nativeCurrency == selectCurrency ) {
			this.convertCurrency = null ;
		} else {
			this.convertCurrency = selectCurrency ;
		}
		this.onLoad(this.ajaxData) ; // Recycle ajaxData
	},
	
	onTbarSelect: function() {
		if( this.filterCountry && this.filterCropYear ) {
			this.startLoading() ;
		}
	},
	startLoading: function() {
		// Reset alternate currency :
		this.convertCurrency = null ;
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'finance_getGrid',
			filter_country: this.filterCountry,
			filter_cropYear: this.filterCropYear
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onLoad(ajaxResponse.data) ;
			},
			scope: this
		}) ;
	},
	onLoad: function( ajaxData ) {
		var me = this ;
		me.ajaxData = ajaxData ;
		if( ajaxData == null ) {
			this.removeAll() ;
			this.updateToolbar() ;
		}
		
		// Currency
		var stdCurrencyCode = ajaxData.params.currency_code,
			stdCurrencyEqUSD = ( this.storeCurrency.getById(stdCurrencyCode) ? this.storeCurrency.getById(stdCurrencyCode).get('eq_USD') : 1 ),
			activeCurrencyCode = this.convertCurrency || ajaxData.params.currency_code,
			activeCurrencySign = ( this.storeCurrency.getById(activeCurrencyCode) ? this.storeCurrency.getById(activeCurrencyCode).get('currency_sign') : null ),
			activeCurrencyEqUSD = ( this.storeCurrency.getById(activeCurrencyCode) ? this.storeCurrency.getById(activeCurrencyCode).get('eq_USD') : 1 ),
			convertCurrencyCoef = (stdCurrencyEqUSD / activeCurrencyEqUSD) ;
		
		// model
		var actualDataIndex = null ;
		var revisionIds = [] ;
		var fields = [
			{name: 'group_key', type:'string'},
			{name: 'group_text', type:'string'},
			{name: 'has_total', type:'boolean'},
			{name: 'has_sub_txt', type:'boolean'},
			{name: 'operation', type:'string'},
			{name: 'row_key', type:'string'},
			{name: 'row_text', type:'string'}
		];
		Ext.Array.each( ajaxData.revisions, function(revision) {
			var revisionId = 'r_'+revision.revision_id ;
			revisionIds.push( revisionId) ;
			fields.push( {name: revisionId + '_value', type:'number', useNull:true} );
			fields.push( {name: revisionId + '_arr', type:'auto', useNull:true} );
			if( revision.is_actual ) {
				actualDataIndex = revisionId
			}
		}) ;
		Ext.define(this.tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var amountRenderer = function( v ) {
			return Ext.util.Format.number( v, '0,0' ) + ( this.currencySign ? ' ' + this.currencySign : '' ) ;
		} ;
		
		var colDefaults = {
			menuDisabled: true,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false
		};
		var columns = [{
			text: 'Group',
			dataIndex: 'group_text',
			hidden: true,
			width: 150,
			_groupColumn: true // only for XLS export
		},{
			text: 'Cost item',
			dataIndex: 'row_text',
			width: 150
		}] ;
		var initColumn = null ;
		var revisionColumn = {
			text: 'Revisions',
			defaults: Ext.apply( Ext.clone(colDefaults),{
				width: 100
			}),
			columns: []
		} ;
		var editingColumn = null ;
		Ext.Array.each( ajaxData.revisions, function(revision) {
			var revisionId = 'r_'+revision.revision_id ;
			if( revision.is_editing ) {
				var validBtn = Ext.create('Ext.button.Button',{
					iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save',
					text: 'Commit revision'
				});
				var buttonMarkup = Ext.DomHelper.markup(validBtn.getRenderTree());
				validBtn.destroy() ;
				
				editingColumn = {
					text: ( revision.is_crop_initial ? 'Initial crop '+me.filterCropYear : 'Build revision ' + revision.revision_date ) + '<div align="center">' + buttonMarkup + '</div>',
					defaults: Ext.apply( Ext.clone(colDefaults),{
						width: 100
					}),
					isEditingColumn: true,
					isInitialEdit: (revision.is_crop_initial),
					menuDisabled: false,
					groupable: true, // false groupable to enable columnMenu
					cls: 'ux-filtered-column',
					columns: [{
						text: 'Edit values',
						align: 'right',
						renderer: amountRenderer,
						filerecordId: revision.filerecord_id,
						revisionId: revisionId,
						dataIndex: revisionId + '_value',
						dataIsEditing: true,
						editor: {
							xtype: 'numberfield',
							hideTrigger:true
						},
						tdCls: 'op5-spec-mrfoxy-financebudget-editcolumn',
						summaryType: function(records,field) {
							if( !(records[0].data.has_total) ) {
								return ;
							}
							var sum=0, rec ;
							for( var i=0; i<records.length ; i++ ) {
								rec = records[i] ;
								sum += rec.data[field] ;
							}
							return sum ;
						},
						summaryRenderer: function(value, meta, record) {
							meta.tdCls += ' op5-spec-mrfoxy-financebudget-celltotal' ;
							return value ;
						}
					}],
					listeners: {
						// attach event listener to buttonMarkup
						afterrender: function(editingColumn) {
							editingColumn.mon( editingColumn.getEl().down('.x-btn'), 'click', function() {
								var doSave ;
								this.handleNewRevisionEnd( doSave = true ) ;
							}, this) ;
						},
						scope: this
					}
				} ;
				if( actualDataIndex != null ) {
					editingColumn.columns.push({
						text: 'Variation',
						renderer: function( value, metaData, record, rowIndex, colIndex ) {
							var header = this.headerCt.getHeaderAtIndex(colIndex),
								editDataIndex = header.editDataIndex,
								actualDataIndex = header.actualDataIndex ;
								
							var value = record.get(editDataIndex+'_value') - record.get(actualDataIndex+'_value') ;
							
							if( value > 0 ) {
								metaData.tdCls = 'op5-spec-dbspeople-balance-pos' ;
								return '<b>+ '+Math.abs(value) + '</b>' ;
							} else if( value < 0 ) {
								metaData.tdCls = 'op5-spec-dbspeople-balance-neg' ;
								return '<b>- '+Math.abs(value) + '</b>' ;
							} else if( value==='' ) {
								return '' ;
							} else {
								return '=' ;
							}
							return '' ;
						},
						dataIsEditingDiff: true,
						editDataIndex: revisionId,
						actualDataIndex: actualDataIndex
					});
				}
			} else {
				if( revision.is_crop_initial ) {
					initColumn = {
						text: 'Initial crop '+me.filterCropYear,
						align: 'right',
						renderer: amountRenderer,
						filerecordId: revision.filerecord_id,
						dataIndex: revisionId + '_value',
						revisionId: revisionId,
						isInitialEdit: true,
						dataIsActual: revision.is_actual,
						tdCls: (revision.is_actual ? 'op5-spec-mrfoxy-financebudget-actualcolumn' : 'op5-spec-mrfoxy-financebudget-archivecolumn')
					} ;
				} else {
					revisionColumn.columns.push({
						text: 'on '+revision.revision_date,
						align: 'right',
						renderer: amountRenderer,
						filerecordId: revision.filerecord_id,
						dataIndex: revisionId + '_value',
						revisionId: revisionId,
						dataIsActual: revision.is_actual,
						tdCls: (revision.is_actual ? 'op5-spec-mrfoxy-financebudget-actualcolumn' : 'op5-spec-mrfoxy-financebudget-archivecolumn')
					});
				}
			}
		},this) ;
		if( initColumn != null ) {
			columns.push(initColumn) ;
		}
		if( revisionColumn.columns.length > 0 ) {
			columns.push(revisionColumn) ;
		}
		if( editingColumn != null ) {
			columns.push(editingColumn) ;
		}
		
		
		var data = [],
			cache_value = {},
			cache_arr = {} ;
		Ext.Array.each( ajaxData.revisions, function(revision) {
			Ext.Array.each( revision.rows, function(row) {
				var revisionId = 'r_'+revision.revision_id ;
				var groupKey = row.group_key ;
				var rowKey = row.row_key ;
				var rowValue = parseFloat(row.value) ;
				var hashStr = revisionId+'%'+groupKey+'%'+rowKey ;
				if( typeof cache_value[hashStr] === 'undefined' ) {
					cache_value[hashStr] = 0 ;
					cache_arr[hashStr] = [] ;
				}
				cache_value[hashStr] += Ext.util.Format.round( rowValue * convertCurrencyCoef, 3 ) ;
				
				var valueObj = (!Ext.isEmpty(row.value_obj) ? Ext.JSON.decode(row.value_obj) : null)
				if( Ext.isEmpty(valueObj) ) {
					valueObj = {} ;
					valueObj['mode'] = 'static' ;
					valueObj['amount'] = rowValue ;
				} else if( Ext.isEmpty(valueObj.mode) ) {
					valueObj['mode'] = ( Ext.isEmpty(valueObj.percent) ? 'static' : 'percent' ) ;
				}
				
				cache_arr[hashStr].push({
					row_sub_prodtag: row.row_sub_prodtag,
					row_sub_txt: row.row_sub_txt,
					value: Ext.util.Format.round( rowValue * convertCurrencyCoef, 3 ),
					value_obj: Ext.JSON.encode(valueObj)
				});
			});
		});
		Ext.Array.each( ajaxData.groups, function(group) {
			Ext.Array.each( group.rows, function(row) {
				model = {
					group_key: group.group_key,
					group_text: group.group_text,
					has_sub_txt: group.has_sub_txt,
					has_total: group.has_total,
					operation: group.operation,
					row_key: row.row_key,
					row_text: row.row_text
				};
				for( var i=0 ; i<revisionIds.length ; i++ ) {
					var revisionId = revisionIds[i],
						revisionKey ;
					
					// lookup in cache for value
					var groupKey = group.group_key ;
					var rowKey = row.row_key ;
					var hashStr = revisionId+'%'+groupKey+'%'+rowKey ;

					var revisionKey = revisionId + '_arr' ;
					model[revisionKey] = cache_arr[hashStr] ;
						
					var revisionKey = revisionId + '_value' ;
					if( cache_value[hashStr] != null ) {
						model[revisionKey] = cache_value[hashStr] ;
					} else {
						model[revisionKey] = 0 ;
					}
				}
				data.push(model) ;
			}) ;
		}) ;
		
		var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
		});
		var grid = {
			border: false,
			xtype:'grid',
			store: {
				model: this.tmpModelName,
				data: data,
				groupField: 'group_key',
				proxy: {
					type: 'memory' ,
					reader: {
						type: 'json'
					}
				}
			},
			plugins: [{
				ptype: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: this.onGridBeforeEdit,
					edit: this.onGridAfterEdit,
					scope: this
				}
			}],
			features: [{
				ftype: 'groupingsummary',
				groupHeaderTpl: '{[(values.rows.length > 0 ? values.rows[0].data.group_text : "")]}',
				collapsible: false,
				enableNoGroups: false,
				enableGroupingMenu: false
			}],
			columns: {
				defaults:colDefaults,
				items: columns
			},
			revisionIds: revisionIds,
			currencySign: activeCurrencySign,
			listeners: {
				afterlayout: function( gridpanel ) {
					gridpanel.headerCt.on('menucreate',me.onColumnsMenuCreate,me) ;
				},
				itemclick: this.onItemClick,
				scope: this
			},
			viewConfig: {
				getRowClass: function(record) {
					if( record.get('group_key') == '4_CALC' && record.get('row_key') == 'promo_total' ) {
						return 'op5-spec-mrfoxy-financebudget-promototal' ;
					}
					if( record.get('group_key') == '4_CALC' && record.get('row_key') == 'promo_available' ) {
						return 'op5-spec-mrfoxy-financebudget-promoavailable' ;
					}
				}
			}
		} ;
		
		this.removeAll() ;
		this.add( grid ) ;
		this.doCalc() ;
		this.updateToolbar() ;
	},
	onColumnsMenuCreate: function( headerCt, menu ) {
		var me = this;
		if( Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM']) ) {
			menu.add([{
				xtype:'menuseparator'
			},{
				itemId: 'btnSave',
				iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-save',
				text: 'Commit revision' ,
				handler: function() {
					var doSave ;
					this.handleNewRevisionEnd( doSave = true ) ;
				},
				scope: this
			},{
				itemId: 'btnDiscard',
				iconCls: 'op5-spec-mrfoxy-financebudget-newrevisionmenu-discard',
				text: 'Discard' ,
				handler: function() {
					var doSave ;
					this.handleNewRevisionEnd( doSave = false ) ;
				},
				scope: this
			}]);
		}
		menu.on('beforeshow', me.onColumnsMenuBeforeShow, me);
	},
	onColumnsMenuBeforeShow: function( menu ) {
		var me = this,
			columnHeader = menu.activeHeader,
			isEditingColumn = columnHeader.isEditingColumn,
			isInitialEdit = columnHeader.isInitialEdit ;
		menu.down('menuseparator').setVisible( isEditingColumn ) ;
		menu.down('#btnSave').setVisible( isEditingColumn ) ;
		menu.down('#btnDiscard').setVisible( isEditingColumn && !isInitialEdit ) ;
	},
	onGridBeforeEdit: function(editor, editObject) {
		var cellEl = editObject.grid.getView().getCell( editObject.record, editObject.column ) ;
		if( this.rowDetailsPanel && this.rowDetailsPanel.parentCell == cellEl ) {
			return false ;
		}
		this.closeRowDetails() ;
		
		if( editObject.record.get('group_key') == '1_BUDGET' && !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','DF','TF']) ) {
			Ext.MessageBox.alert('Not authorized','Encoding total budget is restricted to:<br>- Finance Director<br>- Finance Team<br>') ;
			return false ;
		}
		
		if( editObject.record.get('operation') == '' ) {
			return false ;
		}
		if( editObject.record.get('has_sub_txt') ){
			this.openRowDetails( editObject.record, editObject.column ) ;
			return false ;
		}
		
		//regular edit
		return true ;
	},
	onGridAfterEdit: function(editor, editObject) {
		var filerecordId = editObject.column.filerecordId,
			revisionId = editObject.column.dataIndex,
			rows = this.collectRevisionValues(revisionId) ;
		
		this.saveRevisionValues() ;
		this.doCalc() ;
		this.closeRowDetails() ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var headerCt = view.ownerCt.headerCt,
			cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ),
			isEditing = !Ext.isEmpty(headerCt.down('[dataIsEditing]')) ;
		if( isEditing ) {
			return ;
		}
		if( record.get('has_sub_txt') ) {
			this.openRowDetails( record, cellColumn ) ;
		}
	},
	
	saveRevisionValues: function() {
		var grid = this.down('grid'),
			column = grid.headerCt.down('[dataIsEditing]') ;
		if( column == null ) {
			return ;
		}
		var revisionId = column.revisionId,
			filerecordId = column.filerecordId,
			saveRows = this.collectRevisionValues(revisionId) ;
		
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'finance_setRevision',
			filerecord_parent_id: filerecordId,
			rows: Ext.JSON.encode(saveRows)
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: Ext.emptyFn,
			scope: this
		}) ;
	},
	collectRevisionValues: function( revisionId ) {
		var store = this.down('grid').getStore(),
			rows = [] ;
		store.each( function(record) {
			switch( record.get('operation') ) {
				case '+' :
				case '-' :
					break ;
				default :
					return ;
			}
			if( record.get('has_sub_txt') ) {
				Ext.Array.each( record.get(revisionId + '_arr'), function( subRow ) {
					rows.push({
						group_key: record.get('group_key'),
						row_key: record.get('row_key'),
						row_sub_prodtag: subRow.row_sub_prodtag,
						row_sub_txt: subRow.row_sub_txt,
						value_obj: subRow.value_obj,
						value: subRow.value
					}) ;
				}) ;
			} else {
				rows.push({
					group_key: record.get('group_key'),
					row_key: record.get('row_key'),
					value: record.get(revisionId + '_value')
				}) ;
			}
		});
		return rows ;
	},
	
	doCalc: function() {
		var me = this,
			ajaxData = me.ajaxData,
			grid = me.down('grid'),
			headerCt = grid.headerCt,
			revisionIds = grid.revisionIds,
			calcByRevisionId = {} ;
		
		for( var i=0 ; i<revisionIds.length ; i++ ) {
			var revisionId = revisionIds[i] ;
			calcByRevisionId[revisionId] = 0 ;
		}
		
		grid.getStore().each( function(record) {
			if( record.get('group_key') == '4_CALC' ) {
				return ;
			}
			for( var i=0 ; i<revisionIds.length ; i++ ) {
				var revisionId = revisionIds[i],
					revisionKey = revisionId+'_value' ;
				if( record.get(revisionKey) == null ) {
					record.set(revisionKey,0) ;
					record.commit();
				}
				switch( record.get('operation') ) {
					case '+' :
						calcByRevisionId[revisionId] += record.get(revisionKey) ;
						break ;
					case '-' :
						calcByRevisionId[revisionId] -= record.get(revisionKey) ;
						break ;
				}
			}
		}) ;
		
		grid.getStore().each( function(record) {
			if( record.get('group_key') == '4_CALC' ) {
				for_loop:
				for( var i=0 ; i<revisionIds.length ; i++ ) {
					var revisionId = revisionIds[i],
						revisionKey = revisionId+'_value' ;
					var calcValueTotal = calcByRevisionId[revisionId] ;
					var calcValue ;
					var header = headerCt.down('[dataIndex="'+revisionKey+'"]') ;
				
					switch( record.get('row_key') ) {
						case 'promo_done' :
						case 'promo_foreacast' :
						case 'promo_available' :
							if( header.dataIsEditing || header.dataIsActual ) {} else {
								record.set(revisionKey, null) ;
								continue for_loop ;
							}
							break ;
					}
					switch( record.get('row_key') ) {
						case 'promo_total' :
							calcValue = calcValueTotal ;
							break ;
						case 'promo_done' :
							calcValue = ajaxData.stats.cost_promo_done ;
							break ;
						case 'promo_foreacast' :
							calcValue = ajaxData.stats.cost_promo_forecast ;
							break ;
						case 'promo_available' :
							calcValue = calcValueTotal - (ajaxData.stats.cost_promo_done + ajaxData.stats.cost_promo_forecast) ;
							break ;
						default :
							calcValue = null ;
							break ;
					}
					record.set(revisionKey, calcValue) ;
				}
				record.commit() ;
			}
		}) ;
	},
	
	
	updateToolbar: function() {
		var ajaxData = this.ajaxData,
			tbCurrency = this.down('#tbCurrency'),
			tbExport = this.down('#tbExport'),
			tbNewBegin = this.down('#tbNewBegin'),
			tbNewEnd = this.down('#tbNewEnd') ;
		if( ajaxData == null ) {
			tbExport.setVisible(false) ;
			tbNewBegin.setVisible(false) ;
			tbNewEnd.setVisible(false) ;
			return ;
		}
		tbExport.setVisible(true) ;
		
		var isEditing = isInitial = false ;
		Ext.Array.each( ajaxData.revisions, function(revision) {
			if( revision.is_editing ) {
				isEditing = true ;
				if( revision.is_crop_initial ) {
					isInitial = true ;
				}
			}
		}) ;
		tbNewBegin.setVisible(!isEditing && (this.convertCurrency==null)) ;
		tbNewEnd.setVisible(isEditing) ;
		
		if( isEditing ) {
			tbCurrency.setVisible(false) ;
		} else {
			tbCurrency.setVisible(false) ;
			var currencyCode = this.convertCurrency || ajaxData.params.currency_code ;
			tbCurrency.menu.items.each(function(menuitem) {
				if( menuitem.currencyCode == currencyCode ) {
					tbCurrency.setText( menuitem.text ) ;
					tbCurrency[this.convertCurrency ? 'addCls':'removeCls']('op5-spec-mrfoxy-financebudget-currency-altbtn') ;
					tbCurrency.setVisible(true) ;
				}
			},this) ;
		}
	},
	handleNewRevision: function() {
		var me = this ;
		
		if( !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM','DF','TF']) ) {
			Ext.MessageBox.alert('Not authorized','Create new revision is restricted to:<br>- Country Sales Manager<br>- Finance Director<br>- Finance Team<br>') ;
			return ;
		}
		
		var newRevisionPanel = Ext.create('Ext.form.Panel',{
			width: 400,
			height: 150,
			
			title: 'Define new budget revision',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 120,
				anchor: '100%'
			},
			layout: 'anchor',
			items: [{
				fieldLabel: 'Revision Title',
				xtype: 'textfield',
				allowBlank: false,
				name: 'revision_name'
			},{
				fieldLabel: 'Application date',
				xtype: 'datefield',
				anchor: '',
				format: 'Y-m-d',
				startDay: 1,
				width: 250,
				allowBlank: false,
				name: 'revision_date'
			}],
			frame: true,
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					var formPanel = btn.up('form') ;
					this.onNewRevisionSubmit( formPanel ) ;
				},
				scope: this
			}],
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}]
		});
		
		// Size + position
		newRevisionPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		newRevisionPanel.show();
		newRevisionPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	onNewRevisionSubmit: function( formPanel ) {
		var form = formPanel.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'finance_newRevision',
			filter_country: this.filterCountry,
			filter_cropYear: this.filterCropYear,
			data: Ext.JSON.encode( form.getValues() )
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Problem','Revision date inconsistent. Please correct.') ;
					return ;
				}
				formPanel.destroy() ;
				this.startLoading() ;
			},
			scope: this
		}) ;
	},
	handleNewRevisionEnd: function( doSave, confirmed ) {
		if( doSave == null ) {
			return ;
		}
		if( doSave && !Optima5.Modules.Spec.WbMrfoxy.HelperCache.authHelperQueryRole(['ADM','SM','DF']) ) {
			Ext.MessageBox.alert('Not authorized','Commit revision is restricted to:<br>- Country Sales Manager<br>- Finance Director<br>') ;
			return ;
		}
		if( doSave && !confirmed ) {
			Ext.MessageBox.confirm('Confirmation',"Encode new revision ?", function(buttonStr) {
				if( buttonStr=='yes' ) {
					this.handleNewRevisionEnd(doSave, confirmed=true) ;
				}
			},this) ;
			return ;
		}
		
		var grid = this.down('grid'),
			column = grid.headerCt.down('[dataIsEditing]') ;
		if( column == null ) {
			return ;
		}
		var filerecordId = column.filerecordId,
			revisionId = column.revisionId,
			rows = this.collectRevisionValues(revisionId) ;
			
		var ajaxParams = {
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'finance_setRevision',
			filerecord_parent_id: filerecordId,
			rows: Ext.JSON.encode(rows),
			_subaction: (doSave ? 'commit' : 'discard')
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function() {
				this.startLoading() ;
			},
			scope: this
		}) ;
	},
	handleQuit: function() {
		this.fireEvent('quit') ;
	},
	handleDownloadCfg: function() {
		var me = this,
			ajaxData = me.ajaxData,
			grid = me.down('grid'),
			store = grid.getStore(),
			xlsHeader, xlsSheetGrid, xlsSheetNADetails,
			filter_cropYear = me.filterCropYear,
			filter_country = me.filterCountry,
			activeCurrencyCode = this.convertCurrency || ajaxData.params.currency_code ;
			
			
		xlsFilename = 'WB_MRFOXY_budget_'+filter_cropYear+'_'+filter_country+'.xlsx' ;
		
		
		xlsSheetGrid = {
			xlsTitle: 'Budget',
			xlsHeader: null,
			xlsColumns: null,
			xlsData: null
		} ;
		
		xlsSheetGrid.xlsHeader = [{
			fieldLabel: 'Crop Year',
			fieldValue: filter_cropYear
		},{
			fieldLabel: 'Country',
			fieldValue: filter_country
		},{
			fieldLabel: 'Currency',
			fieldValue: activeCurrencyCode
		}];
		
		xlsSheetGrid.xlsColumns = [] ;
		Ext.Array.each( grid.headerCt.getGridColumns(), function(columnHeader) {
			if( columnHeader.dataIsEditing || columnHeader.dataIsEditingDiff ) {
				return ;
			}
			xlsSheetGrid.xlsColumns.push({
				dataIndex: columnHeader.dataIndex,
				text: columnHeader.text,
				isGroup: ( columnHeader._groupColumn == true )
			});
		}) ;
		
		xlsSheetGrid.xlsData = Ext.pluck( store.getRange(), 'data' ) ;
		
		
		var groupKey = null,
			mapRowKeyTxt = {},
			map_RowKey_values = {},
			revisionDate = null,
			xlsData = [] ;
		Ext.Array.each( ajaxData.groups, function(group) {
			if( group.has_sub_txt ) {
				groupKey = group.group_key ;
				Ext.Array.each( group.rows, function(groupRow) {
					mapRowKeyTxt[groupRow.row_key] = groupRow.row_text ;
				}) ;
				return false ;
			}
		}) ;
		Ext.Array.each( ajaxData.revisions, function(revision) {
			if( revision.is_actual ) {
				revisionDate = revision.revision_date ;
				Ext.Array.each( revision.rows, function(revisionRow) {
					if( revisionRow.group_key != groupKey ) {
						return ;
					}
					if( !map_RowKey_values.hasOwnProperty(revisionRow.row_key) ) {
						map_RowKey_values[revisionRow.row_key] = [] ;
					}
					map_RowKey_values[revisionRow.row_key].push({
						row_sub_prodtag: revisionRow.row_sub_prodtag,
						row_sub_txt: revisionRow.row_sub_txt,
						value: parseInt(revisionRow.value)
					});
				}) ;
				return false ;
			}
		}) ;
		var map_RowKey_values_keys = Object.keys( map_RowKey_values ),
			map_RowKey_values_keysLn = map_RowKey_values_keys.length,
			rowKey, values, isFirst ;
		map_RowKey_values_keys.sort();
		for( var i=0 ; i<map_RowKey_values_keysLn ; i++ ) {
			rowKey = map_RowKey_values_keys[i] ;
			values = map_RowKey_values[rowKey] ;
			isFirst = true ;
			Ext.Array.each( values, function( rowValue ) {
				xlsData.push({
					row_text: ( isFirst ? mapRowKeyTxt[rowKey] : '' ),
					row_sub_prodtag: rowValue.row_sub_prodtag,
					row_sub_prodtag_txt: (this.storeProdtag.getById(rowValue.row_sub_prodtag) ? this.storeProdtag.getById(rowValue.row_sub_prodtag).get('prodtag_txt') : rowValue.row_sub_prodtag ),
					row_sub_txt: rowValue.row_sub_txt,
					value: rowValue.value
				}) ;
				isFirst = false ;
			},this);
		} ;
		
		xlsSheetNADetails = {
			xlsTitle: 'NA_Details',
			xlsHeader: [{
				fieldLabel: 'Crop Year',
				fieldValue: filter_cropYear
			},{
				fieldLabel: 'Country',
				fieldValue: filter_country
			},{
				fieldLabel: 'Currency',
				fieldValue: activeCurrencyCode
			},{
				fieldLabel: 'Revision Date',
				fieldValue: revisionDate
			}],
			xlsColumns: [{
				dataIndex: 'row_text',
				text: 'Store Group',
				isGroup: true
			},{
				dataIndex: 'row_sub_prodtag_txt',
				text: 'ProdTag'
			},{
				dataIndex: 'row_sub_txt',
				text: 'Agreement'
			},{
				dataIndex: 'value',
				text: 'Amount'
			}],
			xlsData: xlsData
		}
		
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'xls_getTableExport',
			data: Ext.JSON.encode({
				xlsFilename: xlsFilename,
				xlsSheets: [xlsSheetGrid, xlsSheetNADetails]
			})
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	handleDownloadDashboard: function() {
		var me = this,
			ajaxData = me.ajaxData,
			grid = me.down('grid'),
			store = grid.getStore(),
			xlsHeader, xlsSheetGrid, xlsSheetNADetails,
			filter_cropYear = me.filterCropYear,
			filter_country = me.filterCountry,
			activeCurrencyCode = this.convertCurrency || ajaxData.params.currency_code ;
			
			
		var xlsFilename = 'WB_MRFOXY_financeDashboard_'+filter_cropYear+'_'+filter_country+'.xlsx' ;
	
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_wb_mrfoxy',
			_action: 'xls_getFinanceDashboard',
			filter_country: this.filterCountry,
			filter_cropYear: this.filterCropYear,
			xlsFilename: xlsFilename
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	
	openRowDetails: function(gridRecord, gridColumn) {
		var me = this,
			grid = this.down('grid'),
			cellEl = grid.getView().getCell( gridRecord, gridColumn ),
			revisionId = gridColumn.revisionId,
			subArr = gridRecord.get( revisionId + '_arr' );
		
			
		cellEl.addCls('op5-spec-mrfoxy-financebudget-celldetails') ;
		
		var rowDetailsPanel = Ext.create('Ext.ux.dams.EmbeddedGrid',{
			width: 650,
			height: 200,
			
			title: (gridColumn.isInitialEdit ? gridColumn.text : 'Revision '+gridColumn.text) + ' : ' + gridRecord.get('row_text'),
			
			readOnly: Ext.isEmpty(gridColumn.dataIsEditing),
			data: subArr,
			columns:[{
				flex:2,
				dataIndex:'row_sub_prodtag',
				type: 'string',
				text:'ProdTag',
				editor: {
					xtype:'op5crmbasebibletreepicker',
					optimaModule: this.optimaModule,
					bibleId: '_PRODTAG',
					selectMode: 'single',
					matchFieldWidth: false
				},
				renderer: function(v) {
					var storeProdtag = me.storeProdtag,
						prodtagTxt = (storeProdtag.getById(v) ? storeProdtag.getById(v).get('prodtag_txt') : null ) ;
					return (prodtagTxt != null ? v + ' - ' + prodtagTxt : v) ; 
				}
			},{
				flex:3,
				dataIndex:'row_sub_txt',
				type: 'string',
				text:'Agreement',
				editor: {xtype:'textfield'}
			},{
				flex:4,
				dataIndex:'value_obj',
				type: 'string',
				text:'Amount',
				editor: Ext.create('Optima5.Modules.Spec.WbMrfoxy.WbMrfoxyFinanceRevisionRowValueField',{
					name:'value_obj',
					currencySign: grid.currencySign
				}),
				renderer: function(v) {
					var valueObj = Ext.JSON.decode(v) ;
					switch( valueObj.mode ) {
						case 'percent' :
							return valueObj.percent + ' % ( ' + valueObj.amount + ' ' + this.currencySign + ' )' ;
						case 'static' :
							return valueObj.amount + ' ' + this.currencySign ;
						default :
							return '' ;
					}
				}
			},{
				flex:0,
				dataIndex:'value',
				type: 'number',
				hidden: true
			}],
			frame: true,
			
			parentCell: cellEl,
			parentRecord: gridRecord,
			revisionId: revisionId,
			
			currencySign: grid.currencySign,
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			listeners: {
				beforedestroy: function(p) {
					var editorArr = p.getData(),
						editorValue = 0 ;
					Ext.Array.each( editorArr, function(lig) {
						editorValue += lig.value ;
					});
					
					p.parentRecord.set( p.revisionId + '_arr', editorArr ) ;
					p.parentRecord.set( p.revisionId + '_value', editorValue ) ;
					
					p.parentCell.removeCls('op5-spec-mrfoxy-financebudget-celldetails') ;
				},
				destroy: function() {
					this.saveRevisionValues() ;
				},
				scope: me
			}
		});
		
		rowDetailsPanel.getPlugin('rowEditor').on({
			edit: function(editor,editEvent) {
				var editRecord = editEvent.record,
					valueObj = Ext.JSON.decode(editEvent.newValues.value_obj),
					value = null ;
				switch( valueObj.mode ) {
					case 'percent' :
						value = Ext.util.Format.round( valueObj.amount * valueObj.percent / 100, 0 )
						break ;
					case 'static' :
						value = valueObj.amount ;
						break ;
					default :
						value = 0 ;
						break ;
				}
				editRecord.set('value',value) ;
				editRecord.commit() ;
			}
		});
		/*
		rowDetailsPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		*/
		
		rowDetailsPanel.show();
		rowDetailsPanel.getEl().alignTo(cellEl, 't-b?');
		
		Optima5.Helper.floatInsideParent( rowDetailsPanel ) ;
		
		me.rowDetailsPanel = rowDetailsPanel ;
	},
	closeRowDetails: function() {
		var me = this ;
		if( me.rowDetailsPanel ) {
			me.rowDetailsPanel.destroy() ;
			me.rowDetailsPanel = null ;
		}
	}
});